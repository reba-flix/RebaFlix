import { getCloudflareContext } from '@opennextjs/cloudflare'
import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from '@prisma/client'
import pg from 'pg'
import { debugServerLogsEnabled, getSafeError } from '@/lib/server-log'

const { Pool } = pg

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const cloudflarePrismaByContext = new WeakMap<object, PrismaClient>()

let nodePrisma: PrismaClient | undefined

type RebaCloudflareEnv = {
  HYPERDRIVE?: {
    connectionString?: string
  }
}

const prismaLog: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']

function createNodePrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  if (debugServerLogsEnabled()) {
    console.log(JSON.stringify({
      scope: 'rebaflix-server',
      event: 'db.client.create',
      runtime: 'node',
      usedPrisma: true,
      usedDirectPg: false,
    }))
  }
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: prismaLog,
  })
}

function createHyperdrivePrismaClient(connectionString: string) {
  if (debugServerLogsEnabled()) {
    console.log(JSON.stringify({
      scope: 'rebaflix-server',
      event: 'db.client.create',
      runtime: 'cloudflare',
      usedPrisma: true,
      usedDirectPg: false,
    }))
  }
  const pool = new Pool({
    connectionString,
    max: 2,
    idleTimeoutMillis: 1_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: prismaLog,
  })
}

function getNodePrismaClient() {
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma ??= createNodePrismaClient()
    return globalForPrisma.prisma
  }

  nodePrisma ??= createNodePrismaClient()
  return nodePrisma
}

function getCloudflarePrismaClient() {
  let context: ReturnType<typeof getCloudflareContext>

  try {
    context = getCloudflareContext()
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cloudflare request context is unavailable in production')
    }

    return null
  }

  const cached = cloudflarePrismaByContext.get(context as object)
  if (cached) return cached

  const { env } = context
  const hyperdrive = (env as RebaCloudflareEnv).HYPERDRIVE

  if (!hyperdrive?.connectionString) {
    throw new Error('Cloudflare Hyperdrive binding HYPERDRIVE is not available')
  }

  const client = createHyperdrivePrismaClient(hyperdrive.connectionString)
  cloudflarePrismaByContext.set(context as object, client)
  return client
}

export function getPrismaClient() {
  if (process.env.NODE_ENV === 'development') {
    return getNodePrismaClient()
  }

  try {
    const cloudflarePrisma = getCloudflarePrismaClient()
    if (cloudflarePrisma) return cloudflarePrisma
  } catch (error) {
    const safeError = getSafeError(error)
    console.error(JSON.stringify({
      scope: 'rebaflix-server',
      event: 'db.client.create.failure',
      runtime: 'cloudflare',
      usedPrisma: true,
      usedDirectPg: false,
      errorName: safeError.name,
      errorMessage: safeError.message,
    }))
    throw error
  }

  return getNodePrismaClient()
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

