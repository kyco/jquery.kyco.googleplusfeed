// jquery.kyco.googleplusfeed brought to you by www.kyco.co.za. Copyright 2013 Cornelius Weidmann. Distributed under the GPL.
(function($) {
    var methods = {
        init: function(options) {
            var defaults = {
                feedLoaderClass: 'feed_loader',
                feedWrapperClass: 'feed_wrapper',
                feedHeaderClass: 'feed_header',
                feedScreenNameClass: 'feed_screen_name',
                feedProfileImageClass: 'feed_profile_image',
                feedContentClass: 'feed_content',
                feedPostsContentClass: 'feed_post',
                feedShowMoreClass: 'feed_sow_more',

                feedPosts: 3, // Feed posts to show on load
                feedIncrement: 3, // Consecutive number of feed post to show on "show more" button click
                feedMax: 20, // Max number of posts to pull in total, totalEntries will not go beyond this number, cannot excced 20 because of Google API in use
                imgSize: 50 // Max is 250
            };

            var settings = $.extend({}, defaults, options);

            return this.each(function() {
                var selector = $(this);

                // Create feed DOM elements.
                var feedContainer = $('<div id="feed_for_' + selector.attr('class') + '"class="kyco_googleplusfeed"></div>');
                var feedLoader = $('<div class="' + settings.feedLoaderClass + '">Loading...</div>');
                var feedWrapper = $('<div class="' + settings.feedWrapperClass + '"></div>');
                var feedHeader =  $('<div class="' + settings.feedHeaderClass + '"></div>');
                var feedScreenName = $('<h3 class="' + settings.feedScreenNameClass + '"></h3>');
                var feedProfileImage = $('<a href="#" class="' + settings.feedProfileImageClass + '" target="_blank"></a>');
                var feedContent = $('<div class="' + settings.feedContentClass + '"></div>');
                var feedShowMore = $('<span class="' + settings.feedShowMoreClass + '">Show more</span>');

                feedHeader.append(feedProfileImage, feedScreenName);
                feedWrapper.append(feedHeader, feedContent, feedShowMore);
                feedContainer.append(feedLoader, feedWrapper);
                selector.append(feedContainer);

                // Main functionality
                var googlePlusFeed = new GoogleFeed(settings.id);

                function initFeed() {
                    var feedEntries = googlePlusFeed.entries;
                    var totalEntries = feedEntries.length;
                    var newLimit = 0;
                    var showMore = false;
                    var i = 0;
                    var j = settings.feedPosts;
                    var str = '';

                    if (feedEntries.length > 0) {
                        for (i; i < settings.feedPosts; i++) {
                            str += '<div class="' + settings.feedPostsContentClass + ' post_' + (i + 1) + '">';
                            str += '<span>Shared publicly - ' + feedEntries[i].publishedDate.substr(0, 16) + '</span>';
                            str += '<p>' + feedEntries[i].contentSnippet + '</p>';
                            str += '<a href="' + feedEntries[i].link + '" target="_blank">View post</a>';
                            str += '</div>';
                        }

                        feedScreenName.html('<a href="' + googlePlusFeed.url + '" target="_blank">' + googlePlusFeed.screenName + '</a>');
                        feedProfileImage.attr('href', googlePlusFeed.url);
                        feedProfileImage.append('<img src="' + googlePlusFeed.image + '" />');
                        feedContent.html(str);

                        feedContent.animate({scrollTop: 0}, 1); // Force scroll to top of content                        

                        feedWrapper.fadeIn(300);
                        feedShowMore.click(function() {
                            if (newLimit <= totalEntries) {
                                newLimit += showMore ? settings.feedIncrement : settings.feedPosts + settings.feedIncrement;
                                newLimit = newLimit > totalEntries ? totalEntries : newLimit;

                                for (j; j < newLimit; j++) {
                                    str += '<div class="' + settings.feedPostsContentClass + ' post_' + (j + 1) + '">';
                                    str += '<span>Shared publicly - ' + feedEntries[j].publishedDate.substr(0, 16) + '</span>';
                                    str += '<p>' + feedEntries[j].contentSnippet + '</p>';
                                    str += '<a href="' + feedEntries[j].link + '" target="_blank">View post</a>';
                                    str += '</div>';

                                    if (j === (totalEntries - 1)) {
                                        feedShowMore.unbind('click').addClass('link');
                                        feedShowMore.text('View more posts on Google+').click(function() {
                                            window.open(googlePlusFeed.url);
                                        });
                                    }
                                }

                                feedContent.animate({scrollTop: feedContent[0].scrollHeight}, 500);
                                showMore = true;
                            }
                            feedContent.html(str);
                        });
                    } else {
                        var noPostsMessage = 'Nothing to show. Empty feed.';
                        console.log(noPostsMessage);
                        feedWrapper.children().remove();
                        feedWrapper.fadeIn(300);
                        feedWrapper.html('<div class="error">' + noPostsMessage + ' <span class="retry">Refresh</span></div>');
                        feedWrapper.find('.retry').click(function() {
                            feedWrapper.children().remove();
                            feedWrapper.append(feedLoader);
                            feedLoader.show();
                            googlePlusFeed.getFeed();
                        });
                    }
                }

                function GoogleFeed(id) {
                    var self = this;
                    self.id = id;
                    self.image = 'https://plus.google.com/s2/photos/profile/' + self.id + '?sz=' + settings.imgSize;
                    self.url = 'https://plus.google.com/' + self.id;
                    self.init = function() {
                        initFeed();
                    };

                    self.getFeed = function() {
                        $.ajax({
                            // Retrieve RSS feed using a handy Google API
                            url: 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=' + settings.feedMax + '&callback=?&q=' + encodeURIComponent('http://plusfeed.frosas.net/' + self.id),
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
                                        feedLoader.fadeOut(300, function() {
                                            $(this).remove();
                                            self.init();
                                        });
                                    });
                                } catch (error) {
                                    var noPostsMessage = 'Unable to retrieve feed contents.';
                                    console.log(noPostsMessage, error);
                                    feedLoader.fadeOut(300, function() {
                                        $(this).remove();
                                        feedWrapper.fadeIn(300);
                                        feedWrapper.html('<div class="error">' + noPostsMessage + ' <span class="retry">Retry</span></div>');
                                        feedWrapper.find('.retry').click(function() {
                                            feedWrapper.children().remove();
                                            feedWrapper.append(feedLoader);
                                            feedLoader.show();
                                            self.getFeed();
                                        });
                                    });
                                }
                            }
                        });
                    };
                    self.getFeed();
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
