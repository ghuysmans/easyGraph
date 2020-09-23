#!/usr/bin/python3

import os, sys, shutil, urllib.request, urllib.parse

minify = False

def sources():
	path = './src/'
	return [os.path.join(base, f) for base, folders, files in os.walk(path) for f in files if f.endswith('.js')]

def build():
	path = './fsm.js'
	data = '\n'.join(open(file, 'r').read() for file in sources())
	done = False
	if minify:
		try:
			url = 'https://javascript-minifier.com/raw'
			reqData = urllib.parse.urlencode({
				'input': data}).encode()
			req = urllib.request.Request(url, data=reqData)
			response = urllib.request.urlopen(req)
			if response.status < 200 or response.status >= 300:
				raise IOError("Error in response")
			result = response.read().decode('utf-8')
			# Add license
			license = './src/_license.js'
			result = open(license).read() + result
			with open(path, 'w') as f:
				f.write(result)
			done = True
		except:
			# Failed to minify, abort
			pass
	if not done:
		with open(path, 'w') as f:
			f.write(data)
	print('built %s (%u bytes)' % (path, len(data)))

def deploy():
	for obj in os.listdir('./'):
		if (os.path.isdir(obj) and obj != '.git'):
			shutil.rmtree(obj)

	os.remove('./build.py')

if __name__ == '__main__':
	if '--minify' in sys.argv:
		minify = True
	build()
	if '--deploy' in sys.argv:
		deploy()
