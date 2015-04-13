Rustplay Command
================

This command uses play.rust-lang.org to evaluate code.

Results are printed to stdout.

Usage:
------

```
Usage:
    rustplay -h | -v
    rustplay [CODE] [-c channel] [-o level] [-D]

Options:
    CODE                    : Code to evaluate. Leave empty to use stdin.
    -c chan,--channel chan  : Channel to use (nightly or beta).
                              Default: nightly
    -D,--debug              : Debug mode, print more info.
    -h,--help               : Show this message.
    -o lvl,--optimize lvl   : Optimization level (0-3).
                              Default: 0
    -v,--version            : Print version and exit.
```

Examples:
---------

Piping source files:

```
cat rustplay_testcode.rs | ./rustplay.js
```

Simple strings:

```
./rustplay.js 'fn main() { println!("Hello World!"); }'
```
