Rustplay Command
================

This nodejs-based command uses http://play.rust-lang.org to evaluate code.

Results are printed to stdout.

Usage:
------

```
Usage:
    rustplay -h | -v
    rustplay [CODE] [-c channel] [-m] [-o level] [-D]

Options:
    CODE                    : Code to evaluate, or file name to read.
                              Leave empty to use stdin.
    -c chan,--channel chan  : Channel to use (nightly or beta).
                              Default: nightly
    -D,--debug              : Debug mode, print more info.
    -h,--help               : Show this message.
    -m,--main               : Wrap code in fn main() {..}.
    -o lvl,--optimize lvl   : Optimization level (0-3).
                              Default: 0
    -v,--version            : Print version and exit.
```

Examples:
---------

Reading files:

```
./rustplay.js rustplay_testcode.rs
```

Simple strings:

```
./rustplay.js 'fn main() { println!("Hello World!"); }'
```

Piping source files:

```
cat rustplay_testcode.rs | ./rustplay.js
```

There is also a convenience wrapper for testing snippets.

Using `-m`, the code will be wrapped in `fn main() { ..code.. }`:

```
./rustplay.js -m 'println!("Hello from rustplay!")'
```

Omitting the last semi-colon is okay, it will be added when `-m` is used.


Requirements:
-------------

* Node.js (0.10.25+)
* docopt - (`npm install docopt`)
* xmlhttprequest - (`npm install xmlhttprequest`)
