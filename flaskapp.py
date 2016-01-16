from flask import Flask, redirect
app = Flask(__name__)
app.config.from_pyfile('flaskapp.cfg')

@app.route('/')
def hello_world():
    return render_template('index.html')

if __name__ == '__main__':
    app.run()
