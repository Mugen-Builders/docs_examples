# Calculator

A Cartesi Rollups 2.0 backend application that evaluates a math expression sent as an advance input (for example `1+2*3`) and emits the result as a notice (`7`). An input that is not a valid expression (for example `abc`) is rejected with a report.

These are the projects you get by following the tutorial [Build a Calculator Application](https://docs.cartesi.io/cartesi-rollups/2.0/tutorials/calculator/), one folder per language. Each was created with `cartesi create calculator --template <language>`, then changed as the tutorial describes:

| Folder | Template | Entry point | Tutorial changes |
| --- | --- | --- | --- |
| [`javascript/`](javascript) | `javascript` | `src/index.js` | `pnpm add -D expr-eval-fork@3.0.3`, `rolldown.config.js` with `external: ["@cartesi/rollup"]` |
| [`python/`](python) | `python` | `dapp.py` | `requirements.txt` with `requests==2.32.5` and `py_expression_eval==0.3.14` |
| [`rust/`](rust) | `rust` | `src/main.rs` | `cargo add meval@=0.2.0 hex@=0.4.3` |
| [`go/`](go) | `go` | `src/dapp.go` | `go get github.com/Knetic/govaluate@v3.0.0+incompatible` (in `src/`) |
| [`cpp/`](cpp) | `cpp` | `dapp.cpp` | none (the template already includes httplib and picojson) |

## Requirements

- [Cartesi CLI](https://docs.cartesi.io/cartesi-rollups/2.0/development/installation/) 2.0.0-alpha.42
- Docker
- JavaScript: Node.js 24+ (pnpm 11 through corepack), only to change the dependencies
- Rust or Go: the Rust toolchain (`cargo`) or Go, only to change the dependencies

## Build and run

The tutorial creates the project in a folder named `calculator`, and the Cartesi CLI names the application after the current folder. Here each language has its own folder, so pass `--project-name calculator` to keep the application name, the inspect URL and the JSON-RPC queries of the tutorial:

```bash
cd javascript   # or python, rust, go, cpp
cartesi build
cartesi run --project-name calculator
```

In another terminal, from the same folder:

```bash
cartesi send "1+2*3" --project-name calculator   # notice "7"
cartesi send "abc" --project-name calculator     # rejected, with a report

curl -X POST http://127.0.0.1:6751/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"cartesi_listOutputs","params":{"application":"calculator","limit":10,"offset":0},"id":1}'
```

Without `--project-name`, the application is named after the folder (for example `javascript`): use that name in the commands and queries instead.

Only one `cartesi run` can use port 6751 at a time: stop one language (Ctrl+C) before running another.
