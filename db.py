# -*- coding: utf-8 -*-
from __future__ import print_function, division, absolute_import, unicode_literals
import sqlite3
from contextlib import closing
from collections import namedtuple
from flask import Blueprint, g, current_app


# set up sqlite metadata database

DATABASE = 'metadata.db'

# persistent storage

# A blueprint is similar to an app object,
# see http://flask.pocoo.org/docs/blueprints/
blueprint = Blueprint('db', __name__)

INITED = False
def is_initted():
    return INITED

# create tubles from fields
def namedtuple_factory(cursor, row):
    """Namedtuple factory to be used with sqlite3."""
    fields = [col[0] for col in cursor.description]
    Row = namedtuple('Row', fields)
    return Row(*row)

# connect the database
def connect_db():
    """Connect to the database and return connection object."""
    current_app.logger.info("Connecting to db")
    con = sqlite3.connect(current_app.config['DATABASE'])
    con.row_factory = namedtuple_factory
    con.execute('PRAGMA foreign_keys = true')
    con.execute('PRAGMA encoding = "UTF-8"')
    return con

# initialize db if it is not already
def init_db():
    """Initialize database with schema from `schema.sql`."""

    if not is_initted():
        with closing(connect_db()) as db:
            current_app.logger.info("Checking if db needs creating.")
            result = db.execute("""SELECT name FROM sqlite_master WHERE type='table' AND name='scoreboard'""").fetchone()
            if None == result:
                current_app.logger.info("Creating db.")
                with blueprint.open_resource('schema.sql') as f:
                    script = f.read()
                    db.cursor().executescript(script)
                db.commit()

            INITED = True



# app_request db connect
@blueprint.before_app_request
def before_request():
    """Run the following code before each request."""
    g.db = connect_db()
    init_db()

# app_request db close
@blueprint.teardown_app_request
def teardown_request(exception):
    """Run the following code before after each request has ended."""
    if hasattr(g, 'db'):
        g.db.close()


def fetchTopN(number):
    query = "SELECT * FROM scoreboard order by score desc limit %d" % number;
    return execute(query).fetchall()

def add_score(name, score, timestamp):
    cur = g.db.cursor()

    execute_cur(cur, """INSERT INTO scoreboard(name, score, timestamp)
    values(?, ?, ?)""", (name, score, timestamp))

    id = cur.lastrowid
    g.db.commit()
    return {'id': id,
            'name': name,
            'score': score,
            'timestamp': timestamp}

def execute_cur(cur, sql, parameters):
    current_app.logger.info("executing in cursor: %s", sql)
    return cur.execute(sql, parameters)

def execute(sql, parameters=[]):
    current_app.logger.info("executing: %s", sql)
    return g.db.execute(sql, parameters)
