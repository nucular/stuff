import urllib.request, time, re
from bs4 import BeautifulSoup as Soup
import sys

ids = []
try:
    with open("ids.txt", "rt") as s:
        ids = s.read().split("\n")
except:
    pass

regex = re.compile("([A-Z][a-z]+)")
found = 0
newfound = 0
lastlen = 0 # for output

try:
    while True:
        res = urllib.request.urlopen("http://explosm.net/rcg")
        soup = Soup(res)
        sel = soup.find("img", {"id": "rcg-comic"})

        m = regex.findall(sel["src"])
        if m:
            for i in m:
                found += 1
                if not i in ids:
                    newfound += 1
                    ids.append(i)

            s = "{} ({} / {})".format(", ".join(m), newfound, found)
            sys.stdout.write("\r" + " "*lastlen + "\r" + s)
            lastlen = len(s)

        time.sleep(1)

except KeyboardInterrupt:
    s = "Saving {} unique IDs ({} new)".format(len(ids), newfound)
    sys.stdout.write("\r" + " "*lastlen + "\r" + s)
    lastlen = len(s)

    ids.sort()
    with open("ids.txt", "wt") as s:
        s.write("\n".join(ids))

    with open("ids.js", "wt") as s:
        s.write("IDS = [")

        last = len(ids) - 1
        for i, v in enumerate(ids):
            s.write("\n\"{}\"".format(v))
            if i != last:
                s.write(",")

        s.write("\n]\n")
