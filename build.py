#!/usr/bin/python3

import os, sys, shutil, urllib.request, urllib.parse

minify = False

def sources():
    path = './src/'
    return [os.path.join(base, f) for base, folders, files in os.walk(path) for f in files if f.endswith('.js')]

def build():
    path = './fsm.js'
    print('building %s' % (path))
    data = '\n'.join(open(file, 'r').read() for file in sources())
    if minify:
        print('minifying %s' % (path))
        try:
            url = 'https://javascript-minifier.com/raw'
            reqData = urllib.parse.urlencode({ 'input': data }).encode()
            req = urllib.request.Request(url, data=reqData)
            response = urllib.request.urlopen(req)
            if response.status < 200 or response.status >= 300:
                raise IOError("Error in response")
            result = response.read().decode('utf-8')

            # Add license
            license = './src/_license.js'
            data = open(license).read() + result
        except:
            # Failed to minify, abort
            print('minifying failed')
            return

    with open(path, 'w') as f:
        f.write(data)
    print('built %s (%u bytes)' % (path, len(data)))

def deploy():
    print('cleaning up folder')
    try:
        for obj in os.listdir('./'):
            if (os.path.isdir(obj) and obj != '.git'):
                shutil.rmtree(obj)

        os.remove('./build.py')
    except:
        print('cleanup failed')
    else:
        print('cleanup successful')

if __name__ == '__main__':
    if '--minify' in sys.argv:
        minify = True
    build()
    if '--deploy' in sys.argv:
        deploy()
