# `wtail(1)`
## Terminal output to the browser in seconds, using UNIX pipes.

`wtail` is a command line utility that grabs every line in `stdin` and broadcasts it over **TCP**. That's it. Nothing fancy. Nothing complicated. Tail log files, app output, or whatever you wish, using `wtail` broadcasting to an `wtail-server` – See multiple streams in the browser, in realtime.

## Installation

    $ npm install -g wtail

## Web app

![](https://s3.amazonaws.com/rtail/github/dark.png)

![](https://s3.amazonaws.com/rtail/github/light.png)

## Rationale

Whether you deploy your code on remote servers using multiple environments or simply have multiple projects, **you must `ssh` to each machine running your code, in order to monitor the logs in realtime**.

There are many log aggregation tools out there, but few of them are realtime. **Most other tools require you to change your application source code to support their logging protocol/transport**.

`wtail` is meant to be a replacement of [logio](https://github.com/NarrativeScience/Log.io/commits/master), which isn't actively maintained anymore, doesn't support node v0.12., and uses *TCP. (TCP requires strict client / server handshaking, is resource-hungry, and very difficult to scale.)*

**The `wtail` approach is very simple:**
* pipe something into `wtail` using [UNIX I/O redirection](http://www.westwind.com/reference/os-x/commandline/pipes.html) [[2]](http://www.codecoffee.com/tipsforlinux/articles2/042.html)
* broadcast every line using TCP
* `wtail-server`, **if listening**, will dispatch the stream into your browser, using [socket.io](http://socket.io/).

`wtail` is a realtime debugging and monitoring tool, which can display multiple aggregate streams via a modern web interface. **There is no persistent layer, nor does the tool store any data**. If you need a persistent layer, use something like [loggly](https://www.loggly.com/).

## Examples

In your app init script:

    $ node server.js 2>&1 | wtail --id "api.myproject.com"

    $ mycommand | wtail > server.log

    $ node server.js 2>&1 | wtail --mute

Supports JSON5 lines:

    $ while true; do echo [1, 2, 3, "hello"]; sleep 1; done | wtail
    $ echo { "foo": "bar" } | wtail
    $ echo { format: 'JSON5' } | wtail

Supports Syslog (docker logs supported!):

```yaml
    logging: 
      driver: syslog
      options: 
        syslog-address: "tcp://0.0.0.0:1337"

```

Using log files (log rotate safe!):

    $ node server.js 2>&1 > log.txt
    $ tail -F log.txt | wtail

For fun and debugging:

    $ cat ~/myfile.txt | wtail
    $ echo "Server rebooted!" | wtail --id `hostname`

## Params

    $ wtail --help
    Usage: cmd | wtail [OPTIONS]

    Options:
      --host, -h     The server host                 [string] [default: "127.0.0.1"]
      --port, -p     The server port                        [string] [default: 9999]
      --id, --name   The log stream id                 [string] [default: (moniker)]
      --mute, -m     Don't pipe stdin with stdout                          [boolean]
      --tty          Keeps ansi colors                     [boolean] [default: true]
      --parse-date   Looks for dates to use as timestamp   [boolean] [default: true]
      --help         Show help                                             [boolean]
      --version, -v  Show version number                                   [boolean]

    Examples:
      server | wtail > server.log         localhost + file
      server | wtail --id api.domain.com  Name the log stream
      server | wtail --host example.com   Sends to example.com
      server | wtail --port 43567         Uses custom port
      server | wtail --mute               No stdout
      server | wtail --no-tty             Strips ansi colors
      server | wtail --no-date-parse      Disable date parsing/stripping


## `wtail-server(1)`

`wtail-server` receives all messages sent from every `wtail` client, displaying all incoming log streams in a realtime web view. **Under the hood, the server uses [socket.io](http://socket.io) to pipe every incoming TCP message to the browser.**

There is little to no configuration – The default TCP/HTTP ports can be changed, but that's it.

## Examples

Use default values:

    $ wtail-server

Always use latest, stable webapp:

    $ wtail-server --web-version stable

Use custom ports:

    $ wtail-server --web-port 8080 --tcp-port 9090

Set debugging on:

    $ DEBUG=wtail:* wtail-server

Open your browser and start tailing logs!

## Params

    $ wtail-server --help
    Usage: wtail-server [OPTIONS]

    Options:
    --tcp-host, --uh  The listening TCP hostname            [default: "127.0.0.1"]
    --tcp-port, --up  The listening TCP port                       [default: 9999]
    --web-host, --wh  The listening HTTP hostname           [default: "127.0.0.1"]
    --web-port, --wp  The listening HTTP port                      [default: 8888]
    --web-version     Define web app version to serve                     [string]
    --help, -h        Show help                                          [boolean]
    --version, -v     Show version number                                [boolean]

    Examples:
    wtail-server --web-port 8080         Use custom HTTP port
    wtail-server --tcp-port 8080         Use custom TCP port
    wtail-server --web-version stable    Always uses latest stable webapp
    wtail-server --web-version unstable  Always uses latest develop webapp
    wtail-server --web-version 0.1.3     Use webapp v0.1.3

## A fork of rTail

* [Kilian Ciuffolo](https://github.com/kilianc)

## License

_This software is released under the MIT license cited below_.

    Copyright (c) 2014 Kilian Ciuffolo, me@nailik.org. All Rights Reserved.

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the 'Software'), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
