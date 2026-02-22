#!/usr/bin/env python3
"""
FouFou — City Trail Generator - Build Script
Produces 3 files: index.html (tiny shell), app-data.js (data), app-code.js (JSX)

Usage: python3 build.py          # production build (stripped)
       python3 build.py --debug   # debug build (keeps console.log)
"""
import re, json, sys, glob

def read_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read()

def strip_for_production(code):
    """Remove debug logging, excessive comments, and blank lines for production."""
    lines = code.split('\n')
    result = []
    skip_depth = 0

    for line in lines:
        stripped = line.strip()

        if skip_depth > 0:
            skip_depth += stripped.count('{') + stripped.count('(') + stripped.count('[')
            skip_depth -= stripped.count('}') + stripped.count(')') + stripped.count(']')
            if skip_depth <= 0:
                skip_depth = 0
            continue

        if re.match(r'\s*console\.(log|warn)\s*\(', stripped):
            opens = stripped.count('(') + stripped.count('{') + stripped.count('[')
            closes = stripped.count(')') + stripped.count('}') + stripped.count(']')
            if opens > closes:
                skip_depth = opens - closes
            continue

        if re.match(r'\s*addDebugLog\s*\(', stripped):
            opens = stripped.count('(') + stripped.count('{') + stripped.count('[')
            closes = stripped.count(')') + stripped.count('}') + stripped.count(']')
            if opens > closes:
                skip_depth = opens - closes
            continue

        if re.match(r'\s*\.then\(\s*\(\)\s*=>\s*console\.(log|warn)\(', stripped):
            continue

        if re.match(r'\s*\.catch\(\s*\w+\s*=>\s*console\.(log|warn)\(', stripped):
            continue

        if stripped.startswith('//') and not stripped.startswith('// __INSERT') and not stripped.startswith('// ==='):
            continue

        if stripped == '' and result and result[-1].strip() == '':
            continue

        result.append(line)

    return '\n'.join(result)

def build():
    debug_mode = '--debug' in sys.argv
    mode = "DEBUG" if debug_mode else "PRODUCTION"
    print(f"🔨 Building FouFou ({mode})...")

    # Read all source files
    template = read_file('_source-template.html')
    code_template = read_file('_app-code-template.js')
    i18n = read_file('i18n.js')
    config = read_file('config.js')

    city_files = sorted(glob.glob('city-*.js'))
    city_data = '\n'.join([read_file(f) for f in city_files])
    if city_files:
        print(f"📦 City files: {', '.join(city_files)}")

    utils = read_file('utils.js')
    app_logic = read_file('app-logic.js')
    views = read_file('views.js')
    dialogs = read_file('dialogs.js')

    # Strip for production
    if not debug_mode:
        before = sum(len(x) for x in [app_logic, views, dialogs, utils, config])
        app_logic = strip_for_production(app_logic)
        views = strip_for_production(views)
        dialogs = strip_for_production(dialogs)
        utils = strip_for_production(utils)
        config = strip_for_production(config)
        after = sum(len(x) for x in [app_logic, views, dialogs, utils, config])
        saved = before - after
        print(f"🧹 Stripped {saved:,} bytes ({saved*100//before}% reduction)")

    # Extract version
    m = re.search(r"VERSION\s*=\s*'([^']+)'", config)
    ver = m.group(1) if m else '0.0.0'
    with open('version.json', 'w') as f:
        json.dump({"version": ver}, f)
    print(f"📋 Version: {ver}")

    # === BUILD FILE 1: app-data.js (i18n + cities + config + utils) ===
    app_data = f"// FouFou app-data.js v{ver}\n"
    app_data += i18n + '\n'
    app_data += city_data + '\n'
    app_data += config + '\n'
    app_data += utils + '\n'

    with open('app-data.js', 'w', encoding='utf-8') as f:
        f.write(app_data)
    data_kb = len(app_data.encode('utf-8')) / 1024
    print(f"📄 app-data.js ({data_kb:.0f}KB)")

    # === BUILD FILE 2: app-code.js (JSX app code) ===
    app_code = code_template
    app_code = app_code.replace('// __INSERT_APP_LOGIC__', app_logic)
    app_code = app_code.replace('// __INSERT_VIEWS__', views)
    app_code = app_code.replace('// __INSERT_DIALOGS__', dialogs)

    with open('app-code.js', 'w', encoding='utf-8') as f:
        f.write(app_code)
    code_lines = app_code.count('\n') + 1
    code_kb = len(app_code.encode('utf-8')) / 1024
    print(f"📄 app-code.js ({code_lines} lines, {code_kb:.0f}KB)")

    # === BUILD FILE 3: index.html (tiny shell with splash) ===
    index_html = template.replace('__VERSION__', ver)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(index_html)
    html_lines = index_html.count('\n') + 1
    html_kb = len(index_html.encode('utf-8')) / 1024
    print(f"📄 index.html ({html_lines} lines, {html_kb:.1f}KB)")

    total_kb = data_kb + code_kb + html_kb
    print(f"✅ Total: {total_kb:.0f}KB (index.html {html_kb:.1f}KB + app-data.js {data_kb:.0f}KB + app-code.js {code_kb:.0f}KB)")

if __name__ == '__main__':
    build()
