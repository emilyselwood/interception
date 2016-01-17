# -*- coding: utf-8 -*-
from __future__ import print_function, division, absolute_import, unicode_literals

import os
import sys
import io
import json
import time
# import requests
import glob
import logging
import urllib
import datetime

from logging.handlers import RotatingFileHandler
from flask import Flask, render_template, jsonify, request, redirect

import db

app = Flask(__name__)
app.config.from_pyfile('flaskapp.cfg')
app.register_blueprint(db.blueprint)

# logging config
log_root = os.environ.get('OPENSHIFT_LOG_DIR','./logs')
log_file = os.path.join(log_root, ('intercepter.log'))
# five files ten megabytes (10 * 1024 * 1024) in size.
handler = RotatingFileHandler(log_file , maxBytes=10485760, backupCount=5)
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(filename)s - %(funcName)s %(levelname)s - %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.setLevel(logging.DEBUG)


@app.route('/')
@app.route('/index.html')
def index():
    return redirect('/static/globe/flooding.html', 302)

@app.route('/fetchTop10', methods=['GET'])
def scoreboard():
    log_request();
    result = db.fetchTopN(10)

    result_list = []
    for r in result:
        result_list.append({
            'id': r[0],
            'name': r[1],
            'score': r[2],
            'timestamp': r[3]
        })

    return logging_jsonify({'scores': result_list})

@app.route('/addScore')
def set_score():
    log_request();

    name = request.args.get('name', '')
    score = request.args.get('score', '')
    current_time = datetime.datetime.now()
    return logging_jsonify(db.add_score(name, score, current_time))

def log_request():
    if len(request.args) > 0:
        app.logger.info("Request: %s %s?%s", request.method, request.path, urllib.urlencode(request.args))
    else:
        app.logger.info("Request: %s %s", request.method, request.path)

def logging_jsonify(result):
    jsoned_result = jsonify(result)
    app.logger.info("Response for %s to %s: %s", request.method, request.path, jsoned_result.data)
    return jsoned_result

if __name__ == '__main__':
    app.run()
