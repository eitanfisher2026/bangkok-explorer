#!/usr/bin/env python3
"""
Bangkok Explorer - Build Script
Combines split files into index.html

Usage: python3 build.py
"""
import re, json

def read_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read()

def build():
    print("🔨 Building Bangkok Explorer...")
    
    template = read_file('_source-template.html')
    config = read_file('config.js')
    utils = read_file('utils.js')
    app_logic = read_file('app-logic.js')
    views = read_file('views.js')
    dialogs = read_file('dialogs.js')
    
    # Extract version and write version.json
    m = re.search(r"VERSION\s*=\s*'([^']+)'", config)
    if m:
        ver = m.group(1)
        with open('version.json', 'w') as f:
            json.dump({"version": ver}, f)
        print(f"📋 Version: {ver}")
    
    output = template
    output = output.replace('// __INSERT_CONFIG__', config)
    output = output.replace('// __INSERT_UTILS__', utils)
    output = output.replace('// __INSERT_APP_LOGIC__', app_logic)
    output = output.replace('// __INSERT_VIEWS__', views)
    output = output.replace('// __INSERT_DIALOGS__', dialogs)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(output)
    
    lines = output.count('\n') + 1
    print(f"✅ Built index.html ({lines} lines)")

if __name__ == '__main__':
    build()
