@echo off
setlocal

set "NEXT_TEST_WASM=1"
set "NEXT_TEST_WASM_DIR=%~dp0..\node_modules\@next\swc-wasm-nodejs"

cd /d "%~dp0.."
npm.cmd run dev
