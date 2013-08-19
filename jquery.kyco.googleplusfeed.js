// jquery.kyco.googleplusfeed brought to you by www.kyco.co.za. Copyright 2013 Cornelius Weidmann. Distributed under the GPL.
(function($) {
    var methods = {
        init: function(options) {

            var defaults = {
                onComplete: function() {}
            };

            var settings = $.extend({}, defaults, options);

            return this.each(function() {
                console.log(settings.id);



                var feedLoaderClass = '.feed_loader';
                var feedContentClass = '.feed_content';
                var feedShowMoreClass = '.feed_show_more';

                var INITIAL = 3; // Feed posts to show on load
                var INCREMENT = 6; // Consecutive number of feed post to show on "show more" button click
                var MAX = 20; // Max number of posts to pull in total, NUM_ENTRIES will not go beyond this number, cannot excced 20 because of Google API in use
                var IMG_SIZE = 100; // Max is 250
                var googlePlusFeed = new GoogleFeed(settings.id);

                function initFeed() {
                    var feedEntries = googlePlusFeed.entries;
                    var NUM_ENTRIES = feedEntries.length;
                    var newLimit = 0;
                    var showMore = false;
                    var i = 0;
                    var j = INITIAL;
                    var str = '';

                    if (feedEntries.length > 0) {
                        for (i; i < INITIAL; i++) {
                            str += '<div class="feed_post_' + (i + 1) + '">';
                            str += '<p>' + '<h5>' + (i +1) + '</h5>' + feedEntries[i].contentSnippet + '</p>';
                            str += '<a href="' + feedEntries[i].link + '" target="_blank">View post</a>';
                            str += '</div><hr />';
                        }
                        $('#google_plus_feed .feed_title').html('<a href="https://plus.google.com/' + googlePlusFeed.id + '" target="_blank">' + googlePlusFeed.screenName + '</a>');
                        $('#google_plus_feed .feed_image').attr('src', googlePlusFeed.image);
                        $('#google_plus_feed .feed').html(str);

                        $(feedContentClass).fadeIn(300);
                        $(feedShowMoreClass).click(function() {
                            if (newLimit <= NUM_ENTRIES) {
                                newLimit += showMore ? INCREMENT : INITIAL + INCREMENT;
                                newLimit = newLimit > NUM_ENTRIES ? NUM_ENTRIES : newLimit;

                                for (j; j < newLimit; j++) {
                                    str += '<div class="feed_post_' + (j + 1) + '">';
                                    str += '<p>' + '<h5>' + (j + 1) + '</h5>' + feedEntries[j].contentSnippet + '</p>';
                                    str += '<a href="' + feedEntries[j].link + '" target="_blank">View post</a>';
                                    str += '</div><hr />';

                                    if (j === (NUM_ENTRIES - 1)) {
                                        $(feedShowMoreClass).unbind('click');
                                        $(feedShowMoreClass).text('View more posts on Google+').click(function() {
                                            window.open(googlePlusFeed.url);
                                        });
                                    }
                                }

                                showMore = true;
                            }
                            $('#google_plus_feed .feed').html(str);
                        });
                    } else {
                        console.log('no entries for ' + googlePlusFeed.screenName);
                    }
                }

                function GoogleFeed(id) {
                    var self = this;
                    self.id = id;
                    self.image = 'https://plus.google.com/s2/photos/profile/' + self.id + '?sz=' + IMG_SIZE;
                    self.url = 'https://plus.google.com/' + self.id;
                    self.init = function() {
                        initFeed();
                    };

                    $.ajax({
                        // Retrieve RSS feed using a handy Google API
                        url: 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=' + MAX + '&callback=?&q=' + encodeURIComponent('http://plusfeed.frosas.net/' + self.id),
                        dataType: 'json',
                        success: function(response) {
                            try {
                                var title = response.responseData.feed.title;
                                self.screenName = title.substr(0, (title.indexOf('@') - 1));

                                self.entries = response.responseData.feed.entries;
                                self.entries.forEach(function(entry) {
                                    entry.contentSnippet = $(entry.content).first().html(); // Overwrite the default contentSnippet that gets returned with a cleaner version
                                });
                                self.raw = response;

                                // Preload profile image and only trigger feed thereafter
                                $('<img src="' + self.image + '"/>').load(function() {
                                    $(feedLoaderClass).fadeOut(300, function() {
                                        $(this).remove();
                                        self.init();
                                    });
                                });
                            } catch (error) {
                                console.log('there was an error getting feed: ', error);
                            }
                        }
                    });
                }





            });
        }
    };

    $.fn.kycoGooglePlusFeed = function(method) {
        // Check if browser supports Array.forEach() method, if it doesn't mimic that functionality,
        // implementation from here: http://stackoverflow.com/questions/2790001/fixing-javascript-array-functions-in-internet-explorer-indexof-foreach-etc
        if (!('forEach' in Array.prototype)) {
            Array.prototype.forEach = function(action, that /*opt*/) {
                for (var i = 0, n = this.length; i < n; i++) {
                    if (i in this) {
                        action.call(that, this[i], i, this);
                    }
                }
            };
        }

        if (typeof method === 'string') {
            method = {
                id: method
            };
        }

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.kycoGooglePlusFeed');
        }
    };
})(jQuery);
