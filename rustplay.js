#!/usr/bin/env node

/*  rustplay
    ...Rust playpen using AJAX.
    -Christopher Welborn 04-12-2015
*/

'use strict';
var docopt = require('docopt');
var fs = require('fs');

var name = 'rustplay';
var version = '0.0.1-1';
var version_str = [name, version].join(' v. ');

var usage_str = [
    version_str,
    '',
    '    Sends code to play.rust-lang.org to be evaluated.',
    '    Results are printed to stdout.',
    '',
    'Usage:',
    '    rustplay -h | -v',
    '    rustplay [CODE] [-c channel] [-m] [-o level] [-D]',
    '',
    'Options:',
    '    CODE                    : Code to evaluate, or file name to read.',
    '                              Leave empty to use stdin.',
    '    -c chan,--channel chan  : Channel to use (nightly or beta).',
    '                              Default: nightly',
    '    -D,--debug              : Debug mode, print more info.',
    '    -h,--help               : Show this message.',
    '    -m,--main               : Wrap code in fn main() {..}.',
    '    -o lvl,--optimize lvl   : Optimization level (0-3).',
    '                              Default: 0',
    '    -v,--version            : Print version and exit.'
].join('\n');

// Parse user args, exit on incorrect args.
var args = docopt.docopt(usage_str, {'version': version_str});

// Global debug flag.
var DEBUG = args['--debug'];
if (DEBUG) {
    var debug = function (s) {
        /* Print a message with the debug label. */
        console.log('debug: ' + s);
    };
    var debugobj = function (lbl, obj) {
        /* Print an object with a label. */
        process.stdout.write('debug: ' + lbl);
        console.dir(obj);
    };
} else {
    // Dummies for when debug is off.
    var debug = function () { return null; };
    var debugobj = function () { return null; };
}

// Emulates the browser's AJAX functionality.
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

// Polyfill for ecma 6 endsWith.
String.prototype.endsWith = function (s) {
    /* Return true/false if a string ends with a given suffix. */
    return this.indexOf(s, this.length - s.length) !== -1;
};

function eval_code(options) {
    /*  Send a piece of code to the play-pen, and return it's result as a
        string.
        Calls options.success(result) on success,
        or options.failure(error_message) on failure.
        Options:
            code (string) : Code to evaluate.
            channel       : beta or nightly.
            optimize      : 0, 1, 2, 3.
            success       : function (eval_result) {},
            failure       : function (error_message) {},

    */

    var success = options.success || function (m) { debug('Success: ' + m); };
    var failure = options.failure || function (r) { debug('Error: ' + r); };
    var channel = options.channel || 'nightly';
    var optimize = options.optimize || '0';
    var code = options.code;
    if (!code) {
        failure('Code was empty!');
        return;
    }
    debug('Channel: ' + channel);
    debug('Optimize: ' + optimize);

    var req = new XMLHttpRequest();
    var data = JSON.stringify({
        version: channel,
        optimize: optimize,
        code: code
    });

    debug('Connecting to playpen...');
    req.open('POST', 'https://play.rust-lang.org/evaluate.json', true);
    // Handler for successful post. (function (e) {..} )
    req.onload = function () {
        if (DEBUG) {
            debugobj('Raw Response: ', req.responseText);
        }

        if (req.responseText === undefined) {
            failure('Response was undefined!');
        }

        if (req.readyState === 4 && req.status === 200) {
            var response = JSON.parse(req.responseText);
            debugobj('JSON Response: ', response);
            if (response.error) {
                debug('Error response.');
                failure(response.error);
            } else if (response.result) {
                debug('Success response.');
                success(response.result);
            } else {
                debug('Unknown response!');
            }
            return;
        }
        debug('Invalid response!');
        failure('Server error!');
    };

    // Handler for failure to post. (function (e) {..})
    req.onerror = function () {
        failure('Failed to post to playpen!');
    };

    req.setRequestHeader('Content-Type', 'application/json');
    req.send(data);
}

function file_exists(filename, options) {
    /*  Call options.exists(filename) if a file exists,
        otherwise call options.missing(filename).
    */
    fs.stat(filename, function (err, st) {
        if (err) {
            debug('This is not a file: ' + filename);
            (options.missing || function () { return null; })(filename);
        } else if (st) {
            debug('File exists: ' + filename);
            (options.exists || function () { return null; })(filename);
        }
    });
}

function handle_code(data) {
    /* Send code with user's command line options. */
    if (args['--main']) {
        // Convenience semi-colon for returning () (unit).
        if (!(data.endsWith(';'))) {
            debug('Adding missing semi-colon.');
            data = data + ';';
        }
        // Convenience wrapper function.
        debug('Wrapping in fn main () { .. }');
        data = ['fn main () { ', ' }'].join(data);
    }

    // Prints with no added newlines.
    var p = function (s) { process.stdout.write(s); };
    eval_code({
        code: data,
        success: p,
        failure: p,
        channel: args['--channel'],
        optimize: args['--optimize']
    });
}

function main() {
    if (args.CODE) {
        file_exists(args.CODE, {
            exists: function (filename) {
                debug('Using a known file...');
                fs.readFile(filename, 'utf8', function (err, data) {
                    if (err) {
                        console.log('Cannot read file: ' + filename, err);
                    } else if (data) {
                        handle_code(data);
                    } else {
                        console.log('File was empty!: ' + filename);
                    }
                });
            },
            missing: function (code) {
                debug('Using user string data...');
                handle_code(code);
            }
        });
    } else {
        debug('Using stdin data...');
        var stdin_data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('readable', function () {
            // Build stdin data into a string.
            var data = process.stdin.read();
            if (data !== null) {
                stdin_data = stdin_data + data;
            }
        });

        process.stdin.on('end', function () {
            // Finished building stdin, send it.
            debug('Sending stdin data:\n' + stdin_data + '\n\n');
            handle_code(stdin_data);
        });
    }
    return 0;
}

process.on('SIGINT', function () {
    /* Print a friendly message when interrupted. */
    console.log('\nUser cancelled.\n');
    process.exit(2);
});

main();
