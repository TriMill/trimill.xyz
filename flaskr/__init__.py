from flask import Flask, render_template, send_from_directory, abort, request, make_response
from werkzeug.middleware.proxy_fix import ProxyFix
import markdown2
import datetime
import os
import ast
import datetime

markdown_extras = ["fenced-code-blocks", "footnotes", "strike", "tables", "metadata"]

data = {
    "feet": [
        "🐝",
        "Best viewed using Internet Explorer 6 or earlier",
        "The HORSE is a noble animal",
        "🦀",
        "<code>segmentation fault (core dumped)</code>",
        "Bees land on thyme",
        "☃",
        "<code># cat /dev/urandom > /dev/sda</code>",
        "<code>:(){ :|: & };:</code>",
        "Formal complaints will recieve responses within 5-7 business days",
        "<code>++++[-&gt;++++&lt;]&gt;+[-&gt;++++++&gt;+++++++&gt;++&lt;&lt;&lt;]&gt;.&gt;--------..+++++.&lt;-.&gt;--.&gt;--.&lt;++.&lt;.&gt;++++.----.</code>",
        "Copywrong © 3034. All rights unreserved.",
        "[<span style='text-decoration: underline;'>citation needed</span>]",
        "Best viewed with eyes",
        "Your browser does not support 7D graphics. Please update for the best user experience.",
        "Press SPACE to jump",
        "🐀",
        "If problems persist, please return to the nearest Blockbuster Video® establishment.",
        "Oversalt to taste",
        "curl -s -L http://bit.ly/10hA8iC | bash",
        "Submit footer text via carrier pigeon to <code>[REDACTED]</code>",
        "GEORGE is inevitable.",
        "trimill.xyz is known to the state of California to cause [REDACTED], ███████, and [DATA EXPUNGED]",
        "Certified <a href=\"https://datatracker.ietf.org/doc/html/rfc9225\">RFC 9225</a> compliant.",
        "9/10 dentists refused to comment.",
    ],
    "next_theme": {
        "system": "dark",
        "dark": "light",
        "light": "contrast",
        "contrast": "contrast-dark",
        "contrast-dark": "system",
    }
}

def index_projects(app):
    projects = []
    proj_dir = os.path.join(app.root_path, app.template_folder, "projects")
    for root, dirs, files in os.walk(proj_dir):
        for file in files:
            try:
                with open(os.path.join(root, file)) as f:
                    metaline = f.read().splitlines()[0]
                if metaline.startswith("{% set meta="):
                    meta = metaline[12:-2].strip()
                    meta = ast.literal_eval(meta)
                    meta["path"] = os.path.relpath(root, start=proj_dir)
                    meta["file"] = file
                    projects.append(meta)
            except Exception as e:
                print(e)
    return sorted(projects, key=lambda p: p.get("title"))

def index_blog(app):
    blogposts = []
    blog_dir = os.path.join(app.root_path, "blog")
    for file in os.listdir(blog_dir):
        try: 
            with open(os.path.join(blog_dir, file)) as f:
                contents = f.read()
            html = markdown2.markdown(contents, extras=markdown_extras)
            meta = html.metadata
            meta["file"] = file
            date_parts = file.removesuffix(".md").split("-")
            date = datetime.date(int(date_parts[0]), int(date_parts[1]), int(date_parts[2]))
            meta["timestamp"] = datetime.datetime.fromisoformat(meta["timestamp"])
            meta["date"] = date
            meta["n"] = int(date_parts[3])
            meta["url"] = f"/blog/{date.isoformat().replace('-','/')}/{meta['n']}"
            blogposts.append(meta)
        except Exception as e:
            print("Error indexing blog post %s: %s" % (file, e))
    return sorted(blogposts, key=lambda post:[post["date"], post["n"]], reverse=True)

def create_app():
    app = Flask(__name__)
    app.wsgi_app = ProxyFix(
        app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
    )
    data["blogposts"] = index_blog(app)
    data["projects"] = index_projects(app)

    @app.route("/favicon.ico")
    def favicon():
        path = os.path.join(app.root_path, "static")
        return send_from_directory(path, "favicon.ico", mimetype="image/vnd.microsoft.icon")

    @app.errorhandler(404)
    def four_oh_four(e):
        theme = request.cookies.get("theme") or "dark"
        return render_template("404.html", data=data, theme=theme), 404

    def get_theme():
        return request.args.get("theme") or request.cookies.get("theme") or "dark"
    
    def set_theme(resp):
        resp = make_response(resp)
        if request.args.get("theme"):
            resp.set_cookie("theme", request.args["theme"], expires=datetime.datetime.now() + datetime.timedelta(days=30))
        return resp

    def load_page(url):
        if url.endswith(".html"):
            path = os.path.join(app.root_path, app.template_folder, url)
            if os.path.exists(path):
                theme = get_theme() 
                return set_theme(render_template(url, data=data, theme=theme))
            else:
                return abort(404)
        else:
            return send_from_directory("templates", url)

    @app.route("/")
    @app.route("/index.html")
    def home():
        return load_page("index.html")

    @app.route("/projects/")
    @app.route("/projects/index.html")
    def projects_index():
        return load_page("projects.html")

    @app.route("/projects/<page>/")
    @app.route("/projects/<page>/<file>")
    def project(page, file="index.html"):
        return load_page(f"projects/{page}/{file}")

    @app.route("/blog/")
    def blog_list():
        theme = get_theme()
        return set_theme(render_template("blog.html", data=data, theme=theme))

    @app.route("/blog/<int:y>/<int:m>/<int:d>/")
    @app.route("/blog/<int:y>/<int:m>/<int:d>/<int:n>")
    def blog_page(y, m, d, n=0):
        date = datetime.date(y, m, d)
        print(date.isoformat())
        path = os.path.join(app.root_path, "blog", f"{date.isoformat()}-{n}.md")
        if os.path.exists(path):
            with open(path) as f:
                contents = f.read()
            content = markdown2.markdown(contents, extras=markdown_extras)
            meta = content.metadata
            theme = get_theme()
            return set_theme(render_template("_blog.html", data=data, theme=theme, content=content, date=date, meta=meta))
        else:
            return abort(404)

    @app.route("/blog/rss.xml")
    def blog_rss():
        xml = render_template("rss.xml", data=data)
        response = make_response(xml)
        response.headers["Content-Type"] = "application/rss+xml; charset=utf-8"
        return response

    @app.route("/blog/atom.xml")
    def blog_atom():
        xml = render_template("atom.xml", data=data)
        response = make_response(xml)
        response.headers["Content-Type"] = "application/atom+xml; charset=utf-8"
        return response
        
    return app
