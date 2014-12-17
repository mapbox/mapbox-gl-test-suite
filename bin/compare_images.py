#!/usr/bin/env python

import sys, re
import os
from os import path
import json
import subprocess

base_dir = 'tests'
code = 0
failures = 0

dirs = [ d for d in os.listdir(base_dir) if path.isdir(path.join(base_dir, d)) ]

results = ''
result_template = open('templates/result.html.tmpl').read()

def writeResult(name, key, info, error, difference):
    global code
    global failures
    global results

    color = 'green';
    allowedDifference = info['diff'] if 'diff' in info else 0.001
    if difference > allowedDifference:
        color = 'red';
        if code < 1:
            code = 1;
        failures += 1;
        print '\x1B[31mComparing %s/%s: %f > %f\x1B[39m' % (name, key, difference, allowedDifference)
    else:
        print '\x1B[32mComparing %s/%s: %f < %f\x1B[39m' % (name, key, difference, allowedDifference)

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
        actual = path.join(base_dir, name, key, 'actual.png');
        expected = path.join(base_dir, name, key, 'expected.png');
        diff = path.join(base_dir, name, key, 'diff.png');

        command = 'compare -metric MAE %s %s %s' % (actual, expected, diff)
        process = subprocess.Popen(command, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, shell=True)
        output, error = process.communicate()

        # The compare program returns 2 on error otherwise 0 if the images
        # are similar or 1 if they are dissimilar.
        if process.returncode == 2:
            writeResult(name, key, info[key], error.strip(), float('inf'));
            code = 2;
            pass
        else:
            match = re.match('^\d+(?:\.\d+)?\s+\(([^\)]+)\)\s*$', error)
            difference = float(match.group(1) if match else 'inf')
            writeResult(name, key, info[key], '' if match else error, difference);

result = open(path.join(base_dir, 'index.html'), 'w')
result.write(open('templates/results.html.tmpl').read().format(results = results))

print ''
print 'Results at: %s' % path.abspath(path.join(base_dir, 'index.html'));

if failures > 0:
    print '\x1B[1m\x1B[31m%d %s match\x1B[39m\x1B[22m' % (failures, 'image doesn\'t' if failures == 1 else 'images don\'t');
else:
    print '\x1B[1m\x1B[32mAll images match\x1B[39m\x1B[22m';

exit(code)
