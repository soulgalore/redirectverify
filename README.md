Bulk verify redirects
=============
Here are a simple script to bulk verify a lot of redirect.

Install
=============
1. Clone this directory <code>git clone git@github.com:soulgalore/redirectverify.git</code>
2. Go into the cloned dir
3. Run <code>npm install</code>

What you need
=============
The script needs a ;-separated file that looks like this:
<pre>
/my/path/to/be/redirected;/my/end/point
/my/path/to/be/redirected2;/my/end/point2
</pre>

You can choose how many URL:s that will be tested at the same time with the parameter <code>parallel</code>. Be nice to the server if you can and use only 1.

You need to feed it with the start part of the URL (the domain) and the path to the file.
Run it like this:
<code>nodejs bin/redirect.js --starturl http://www.mydomain.com --file myFile --parallel 1</code>

How it works
=============
The script will test each URL in the file, access it, test that it is redirected (only one redirect per URL) and that it ends on the end point URL (the second URL on each row on the file). If we get a 400/500 error that will be reported.


The script will store two files named after the domain you test, one with failing urls and one with working. The files are ,-csv file so you can easily import it in Excel and check which URL:s that failed and why.



