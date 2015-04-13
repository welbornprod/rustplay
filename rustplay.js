#!/usr/bin/env node

/*  rustplay
    ...Rust playpen using AJAX.
    -Christopher Welborn 04-12-2015
*/

'use strict';
var docopt = require('docopt');
var sys = require('sys');

var name = 'rustplay';
var version = '0.0.1';
var version_str = [name, version].join(' v. ');

var usage_str = [
    version_str,
    '',
    '    Sends code to play.rust-lang.org to be evaluated.',
    '    Results are printed to stdout.',
    '',
    'Usage:',
    '    rustplay -h | -v',
    '    rustplay [CODE] [-c channel] [-o level] [-D]',
    '',
    'Options:',
    '    CODE                    : Code to evaluate. Leave empty to use stdin.',
    '    -c chan,--channel chan  : Channel to use (nightly or beta).',
    '                              Default: nightly',
    '    -D,--debug              : Debug mode, print more info.',
    '    -h,--help               : Show this message.',
    '    -o lvl,--optimize lvl   : Optimization level (0-3).',
    '                              Default: 0',
    '    -v,--version            : Print version and exit.'
].join('\n');

var args = docopt.docopt(usage_str, {'version': version_str});

// Global debug flag.
var DEBUG = args['--debug'];
if (DEBUG) {
    var debug = function (s) { sys.puts('debug: ' + s); };
} else {
    var debug = function (s) { return s; };
}

// Emulates the browser's functionality.
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

function send_code(options) {
    /*  Send a piece of code to the play-pen, and return it's result.
        Options:
            code (string) : Code to evaluate.
            channel       : beta or nightly.
            optimize      : 0, 1, 2, 3.
            success       : function (eval_result) {},
            failure       : function (error_message) {},

    */

    var success = options.success || function (m) { return m; };
    var failure = options.failure || function (r) { return r; };
    var channel = options.channel || 'nightly';
    var optimize = options.optimize || '0';
    var code = options.code;
    if (!code) {
        failure('Code was empty!');
        return;
    }
    debug('Channel: ' + channel + '\nOptimize: ' + optimize);

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
            debug('Raw Response:');
            console.dir(req.responseText);
        }

        if (req.responseText === undefined) {
            failure('Response was undefined!');
        }

        if (req.readyState === 4 && req.status === 200) {
            var response = JSON.parse(req.responseText);
            debug('JSON Response: ' + response);
            if (response.error) {
                debug('Error response.');
                failure(response.error);
            } else if (response.result) {
                debug('Success response.');
                success(response.result);
            } else {
                debug('Unknown response!');
            }
        }
    };

    // Handler for failure to post. (function (e) {..})
    req.onerror = function () {
        failure('Failed to post to playpen!');
    };

    req.setRequestHeader('Content-Type', 'application/json');
    req.send(data);
}


function handle_data(data) {
    /* Send code with user's command line options. */
    send_code({
        code: data,
        success: sys.puts,
        failure: sys.puts,
        channel: args['--channel'],
        optimize: args['--optimize']
    });
}

function main() {
    if (args.CODE) {
        debug('Using user data...');
        handle_data(args.CODE);
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
            handle_data(stdin_data);
        });
    }
}

main();
