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

/*global jQuery*/
(function ($) {

// This is evil, but necessary to work around a disqus problem.
function replaceDocumentWrite () {
  document.write = function (string) {
    $('<div/>').html (string).appendTo ('body');
  }
}

function setGlobal (name, value) {
  window[name] = value;
}

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
  var options = $.extend (defaults, options);

  if (typeof options.url === 'string') {
    setGlobal ('disqus_url', options.url);
  }

  if (typeof options.title === 'string') {
    setGlobal ('disqus_title', options.title);
  }

  if (typeof options.message === 'string') {
    setGlobal ('disqus_message', options.message);
  }

  var url = 'http://disqus.com/forums/' + forumName + '/embed.js';

  this.eq (0).each (function () {
    $(this).empty ().append ('<div id="disqus_thread"/>');
  });

  replaceDocumentWrite ();

  $.getScript (url);

  return this;
};

}) (jQuery);

// vim:set et sw=2 sts=2:
