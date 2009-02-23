/*! Copyright © 2009 Johan Kiviniemi
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 */
/* THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/* The external Disqus and Digg scripts use document.write which horribly
 * breaks everything if executed after the DOM is ready. This plugin uses an
 * ugly hack: it replaces document.write with a version that appends the HTML
 * to the element in DOM where each service respectively expects it to write.
 *
 * If you come up with a better way to do it, please share it with the author.
 */

/*global jQuery, _gat*/
(function ($) {

// Enable minification.
var DOCUMENT  = document,
    UNDEFINED = undefined;

// Prefer meta[name=title] to title, in case the document contains:
// <title>An awesome document – My awesome website</title>
// <meta name="title" content="An awesome document">
function title () {
  return $('meta[name=title]').attr ('content') ||
         $('title').text ();
}

function description () {
  return $('meta[name=description]').attr ('content');
}

function document_uri () {
  return $('link[rel=self]').attr ('href');
}

function handleOptions (prefix, defaults, options) {
  for (var option in defaults) {
    if (defaults.hasOwnProperty (option)) {
      if (typeof options[option] === 'string') {
        // Set a global.
        window[prefix + option] = options[option];
      }
    }
  }
}

// We want to cache the scripts.
function getScriptCaching (uri, callback) {
  return $.ajax ({
    url:      uri,
    success:  callback,
    dataType: 'script',
    cache:    true
  });
}

function Queue () {
  this.running = false;
  this.queue   = [];
}

Queue.prototype.push = function (writeTarget, scriptUrl) {
  this.queue.push ([writeTarget, scriptUrl]);

  if (! this.running) {
    this.pop ();
  }
};

Queue.prototype.pop = function () {
  this.running = true;

  var item = this.queue.shift ();
  if (! item) {
    this.running = false;
    // Evil!
    DOCUMENT.write = DOCUMENT.writeln = function () { };
    return;
  }

  var writeTarget = item[0],
      scriptUrl   = item[1];

  // Evil!
  DOCUMENT.write = function (data) {
    $('<div/>').html (data).children ().appendTo (writeTarget);
  };
  DOCUMENT.writeln = function (data) {
    DOCUMENT.write (data + "\n");
  };

  var theQueue = this;
  getScriptCaching (scriptUrl, function () {
    theQueue.pop ();
  });
};

var queue = new Queue ();

/* Digg:
 *
 * WARNING: The function replaces document.write! The digg JavaScript uses it,
 * which causes breakage.
 *
 * <div id="digg"></div>
 *
 * $(function () {
 *   $('#digg').loadDigg ();
 * });
 */

$.fn.loadDigg = function (forumName, options) {
  var defaults = {
    url:      document_uri (),
    title:    title (),
    bodytext: description (),
    media:    UNDEFINED,
    topic:    UNDEFINED,
    skin:     UNDEFINED,
    bgcolor:  UNDEFINED,
    window:   UNDEFINED
  };

  handleOptions ('digg_', defaults, $.extend ({}, defaults, options));

  this.eq (0).each (function () {
    $(this).empty ();

    queue.push (this, 'http://digg.com/tools/diggthis.js');
  });

  return this;
};

/* Disqus:
 *
 * WARNING: The function replaces document.write! The disqus JavaScript uses
 * it, which causes breakage.
 *
 * <div id="disqus">
 *   <p><a href="http://<forumName>.disqus.com/?url=ref">
 *     View the discussion thread.
 *   </a></p>
 * </div>
 *
 * $(function () {
 *   $('#disqus').loadDisqus ('<forumName>');
 * });
 */

$.fn.loadDisqus = function (forumName, options) {
  var defaults = {
    url:     document_uri (),
    title:   title (),
    message: UNDEFINED
  };

  handleOptions ('disqus_', defaults, $.extend ({}, defaults, options));

  this.eq (0).each (function () {
    $(this).empty ().append ('<div id="disqus_thread"/>');

    queue.push (this, 'http://disqus.com/forums/' + forumName + '/embed.js');
  });

  return this;
};

/* Google Analytics:
 *
 * $(function () {
 *   $.loadGoogleAnalytics ('<your-ga-identifier>');
 * });
 */

$.loadGoogleAnalytics = function (id) {
  var uri;

  if (DOCUMENT.location.protocol === 'https:') {
    uri = 'https://ssl.';
  } else {
    uri = 'http://www.';
  }

  uri += 'google-analytics.com/ga.js';

  getScriptCaching (uri, function () {
    try {
      _gat._getTracker (id)._trackPageview ();
    } catch (e) { }
  });
};

}) (jQuery);

// vim:set et sw=2 sts=2:
