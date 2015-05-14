#!/usr/bin/env python

import sys, re
import os
from os import path
import json
import subprocess

mode = 'js'
if len(sys.argv) > 1 and sys.argv[1]:
    mode = sys.argv[1]

base_dir = 'tests'
code = 0
failureCount = 0
ignoredCount = 0
ignoredMatchCount = 0
matchCount = 0

dirs = [ d for d in os.listdir(base_dir) if path.isdir(path.join(base_dir, d)) ]

results = ''
result_template = open('templates/result.html.tmpl').read()

def writeResult(name, key, info, error, difference):
    global code
    global failureCount
    global ignoredCount
    global ignoredMatchCount
    global matchCount
    global results

    color = 'green'

    allowedDifference = 0.001
    if 'diff' in info:
        if type(info['diff']) == dict:
            if mode in info['diff']:
                allowedDifference = float(info['diff'][mode])
        else:
            allowedDifference = float(info['diff'])

    ignored = False
    if 'ignored' in info:
        if type(info['ignored']) == dict:
            ignored = mode in info['ignored']
        else:
            ignored = info['ignored']

    if ignored and difference > allowedDifference:
        color = 'grey'
        ignoredCount += 1
        print '\x1B[37mo [Comparing %s/%s: %f > %f]\x1B[39m' % (name, key, difference, allowedDifference)
    elif ignored:
        color = 'yellow'
        ignoredMatchCount += 1
        print '\x1B[33m* [Comparing %s/%s: %f <= %f]\x1B[39m' % (name, key, difference, allowedDifference)
    elif difference > allowedDifference:
        color = 'red'
        if code < 1:
            code = 1
        failureCount += 1
        print '\x1B[31mx [Comparing %s/%s: %f > %f]\x1B[39m' % (name, key, difference, allowedDifference)
    else:
        matchCount += 1
        print '\x1B[32mv [Comparing %s/%s: %f <= %f]\x1B[39m' % (name, key, difference, allowedDifference)

    results += result_template.format(
        name = name,
        key = key,
        color = color,
        error = ('<p>%s</p>' % error) if error else '',
        difference = difference,
        zoom = info['zoom'] if 'zoom' in info else 0,
        center = info['center'] if 'center' in info else [0, 0],
        bearing = info['bearing'] if 'bearing' in info else 0,
        width = info['width'] if 'width' in info else 512,
        height = info['height'] if 'height' in info else 512
    )

for name in dirs:
    with open(path.join(base_dir, name, 'info.json'), 'r') as f:
        info = json.load(f)

    for key in info:
        # Skip disabled tests
        if mode in info[key] and not info[key][mode]:
            continue

        actual = path.join(base_dir, name, key, 'actual.png')
        expected = path.join(base_dir, name, key, 'expected.png')
        diff = path.join(base_dir, name, key, 'diff.png')

        if os.path.isfile(actual) and os.path.isfile(expected):
            command = 'compare -metric MAE %s %s %s' % (actual, expected, diff)
            process = subprocess.Popen(command, stdout=subprocess.PIPE,
                                       stderr=subprocess.PIPE, shell=True)
            output, error = process.communicate()

            # The compare program returns 2 on error otherwise 0 if the images
            # are similar or 1 if they are dissimilar.
            if process.returncode == 2:
                writeResult(name, key, info[key], error.strip(), float('inf'))
                code = 2
                pass
            else:
                match = re.match('^\d+(?:\.\d+)?\s+\(([^\)]+)\)\s*$', error)
                difference = float(match.group(1) if match else 'inf')
                writeResult(name, key, info[key], '' if match else error, difference)
        else:
            # File does not exist
            writeResult(name, key, info[key], "File does not exist", float('inf'))
            code = 1

result = open(path.join(base_dir, 'index.html'), 'w')
result.write(open('templates/results.html.tmpl').read().format(results = results))

print ''
print 'Results at: %s' % path.abspath(path.join(base_dir, 'index.html'))

totalCount = matchCount + ignoredMatchCount + ignoredCount + failureCount

if matchCount > 0:
    print '\x1B[1m\x1B[32m%d %s match\x1B[39m\x1B[22m (%.1f%%)' % (matchCount, 'image' if matchCount == 1 else 'images', 100 * matchCount / totalCount)

if ignoredMatchCount > 0:
    print '\x1B[1m\x1B[33m%d %s match but were ignored\x1B[39m\x1B[22m (%.1f%%)' % (ignoredMatchCount, 'image' if ignoredMatchCount == 1 else 'images', 100 * ignoredMatchCount / totalCount)

if ignoredCount > 0:
    print '\x1B[1m\x1B[37m%d %s ignored\x1B[39m\x1B[22m (%.1f%%)' % (ignoredCount, 'image' if ignoredCount == 1 else 'images', 100 * ignoredCount / totalCount)

if failureCount > 0:
    print '\x1B[1m\x1B[31m%d %s match\x1B[39m\x1B[22m (%.1f%%)' % (failureCount, 'image doesn\'t' if failureCount == 1 else 'images don\'t', 100 * failureCount / totalCount)

exit(code)
