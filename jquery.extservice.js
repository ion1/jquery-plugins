/* Copyright © 2009 Johan Kiviniemi
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
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
    document.write = function () { };
    return;
  }

  var writeTarget = item[0],
      scriptUrl   = item[1];

  // Evil!
  document.write = function (data) {
    $('<div/>').html (data).children ().remove ().appendTo (writeTarget);
  };

  var theQueue = this;
  $.getScript (scriptUrl, function () {
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
    url:      undefined,
    title:    undefined,
    bodytext: undefined,
    media:    undefined,
    topic:    undefined,
    skin:     undefined,
    bgcolor:  undefined,
    window:   undefined
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
    url:     undefined,
    title:   undefined,
    message: undefined
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

  if (document.location.protocol === 'https:') {
    uri = 'https://ssl.';
  } else {
    uri = 'http://www.';
  }

  uri += 'google-analytics.com/ga.js';

  $.getScript (uri, function () {
    try {
      _gat._getTracker (id)._trackPageview ();
    } catch (e) { }
  });
};

}) (jQuery);

// vim:set et sw=2 sts=2:
