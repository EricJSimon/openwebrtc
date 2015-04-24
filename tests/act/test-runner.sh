#!/bin/bash
#
# Copyright (c) 2015, Ericsson AB. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without modification,
# are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
# list of conditions and the following disclaimer.
#
# 2. Redistributions in binary form must reproduce the above copyright notice, this
# list of conditions and the following disclaimer in the documentation and/or other
# materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
# IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
# INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
# NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
# PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
# WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
# OF SUCH DAMAGE.

ROOM="automatedtesting_${RANDOM}"
URL="http://localhost:8080/#${ROOM}"

cd $(dirname $0)


function cleanup() {
  kill $browser_pid_2
  kill $browser_pid_1
echo "$Brow1" ${browser_pid_2}, "$Brow2 " ${browser_pid_1}
}
trap cleanup EXIT


# Runs Google Chrome with given flags
function start_chrome() {
	/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome  \
        --enable-logging=stderr \
        --no-first-run \
        --no-default-browser-check \
        --disable-translate \
        --user-data-dir=$D \
        --use-fake-ui-for-media-stream \
        --use-fake-device-for-media-stream \
        --vmodule="*media/*=3,*turn*=3" \
        "$1" >> browser_$2_chrome.log 2>&1 2>/dev/null &
}

#Runs Firefox with modified profile
function start_firefox() {
	/Applications/Firefox.app/Contents/MacOS/firefox \
      --profile FirefoxTestProfile.default \
      "$1" >> browser_$2_firefox.log 2>&1 2>/dev/null &
}

#Runs Safari
function start_safari() {
	open -a "Safari" \
	"$1" >> browser_$2_safari.log 2>&1 2>/dev/null &
}


function run_test() {
	start_$1 "${URL}" 1
	browser_pid_1=$!

	start_$2 "${URL}" 2
	browser_pid_2=$!

	node ~/Desktop/Node/node.js
	kill $browser_pid_1 2>/dev/null
	kill $browser_pid_2 2>/dev/null
}

run_test "$1" "$2"

Brow1="${1}"
Brow2="${2}"

echo SUCCESS
# do nothing in the case of success