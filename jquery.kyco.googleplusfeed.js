/**
 * jquery.kyco.googleplusfeed
 * v1.0.1
 *
 * Brought to you by http://www.kyco.co.za
 * Copyright 2013 Cornelius Weidmann
 * Distributed under the GPL
 */
(function($) {
    var methods = {
        init: function(options) {
            var defaults = {
                feedPosts: 3, // Feed posts to show on load
                postsIncrement: 3, // Number of feed posts to show on "Show more" button click
                maxPosts: 20, // Max number of posts to pull before "Show more" will go to Google+, cannot excced 20 because of Google API in use
                profileImageSize: 50 // Max size is 250
            };

            var settings = $.extend({}, defaults, options);

            return this.each(function() {
                var selector = $(this);

                // Create feed DOM elements.
                var container = $('<div id="feed_' + selector.attr('class') + '" class="kyco_googleplusfeed"></div>');
                var loader = $('<div class="feed_loader">Loading...</div>');
                var wrapper = $('<div class="feed_wrapper"></div>');
                var header =  $('<div class="feed_header"></div>');
                var screenName = $('<h3 class="feed_screen_name"></h3>');
                var profileImage = $('<a href="#" class="feed_profile_image" target="_blank"></a>');
                var content = $('<div class="feed_content"></div>');
                var showMoreButton = $('<span class="feed_sow_more">Show more</span>');

                header.append(profileImage, screenName);
                wrapper.append(header, content, showMoreButton);
                container.append(loader, wrapper);
                selector.append(container);

                // Main functionality
                var googlePlusFeed = new GoogleFeed(settings.id);

                function initFeed() {
                    var currentPosts = settings.feedPosts;
                    var totalPosts = googlePlusFeed.entries;
                    var feedLength = totalPosts.length;
                    var postsIncrement = settings.postsIncrement;
                    var postsLimit = 0;
                    var showMore = false;
                    var i = 0;
                    var j = currentPosts;
                    var str = '';

                    if (feedLength > 0) {
                        // Posts exist for the given Google+ ID
                        for (; i < currentPosts; i++) {
                            str += stringBuilder(i);
                        }

                        screenName.html('<a href="' + googlePlusFeed.url + '" target="_blank">' + googlePlusFeed.screenName + '</a>');
                        profileImage.attr('href', googlePlusFeed.url);
                        profileImage.append('<img src="' + googlePlusFeed.image + '">');

                        content.html(str); // Update feed

                        content.animate({scrollTop: 0}, 1); // Force scroll to top of content                        
                        wrapper.fadeIn(300); // Show the content
                    } else {
                        // No posts exist for the given Google+ ID
                        wrapper.children().remove();
                        wrapper.html('<div class="error">Nothing to show. Empty feed. <span class="retry">Refresh</span></div>');
                        wrapper.fadeIn(300); // Show the content

                        // Refresh button functionality
                        wrapper.find('.retry').click(function() {
                            wrapper.children().remove();
                            wrapper.append(loader);
                            loader.show();
                            googlePlusFeed.getFeed(); // Try again
                        });
                    }

                    // Show more button functionality
                    showMoreButton.click(function() {
                        if (postsLimit <= feedLength) {
                            postsLimit += showMore ? postsIncrement : currentPosts + postsIncrement;
                            postsLimit = postsLimit > feedLength ? feedLength : postsLimit;

                            for (; j < postsLimit; j++) {
                                str += stringBuilder(j);

                                if (j === (feedLength - 1)) {
                                    showMoreButton.unbind('click').addClass('link');
                                    showMoreButton.text('View more posts on Google+').click(function() {
                                        window.open(googlePlusFeed.url);
                                    });
                                }
                            }

                            content.animate({scrollTop: content[0].scrollHeight}, 500);
                            showMore = true;
                        }

                        content.html(str); // Update feed
                    });


                    function stringBuilder(e) {
                        // Generates the HTML for each post
                        var newStr = '';

                        newStr += '<div class="feed_post post_' + (e + 1) + '">';
                        newStr += '<span>Shared publicly - ' + totalPosts[e].publishedDate.substr(0, 16) + '</span>';
                        newStr += '<p>' + totalPosts[e].contentSnippet + '</p>';
                        newStr += '<a href="' + totalPosts[e].link + '" target="_blank">View post</a>';
                        newStr += '</div>';

                        return newStr;
                    }
                }

                function GoogleFeed(id) {
                    var self = this;
                    self.id = id;
                    self.image = 'https://plus.google.com/s2/photos/profile/' + self.id + '?sz=' + settings.profileImageSize;
                    self.url = 'https://plus.google.com/' + self.id;
                    self.init = function() {
                        initFeed();
                    };

                    self.getFeed = function() {
                        $.ajax({
                            // Retrieve RSS feed using a handy Google API and http://plusfeed.frosas.net
                            url: 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=' + settings.maxPosts + '&callback=?&q=' + encodeURIComponent('http://plusfeed.frosas.net/' + self.id),
                            dataType: 'json',
                            success: function(response) {
                                try {
                                    // Find and trim data to fit our needs
                                    self.raw = response; // Used for debugging
                                    var title = response.responseData.feed.title;
                                    self.screenName = title.substr(0, (title.indexOf('@') - 1));
                                    self.entries = response.responseData.feed.entries;

                                    self.entries.forEach(function(entry) {
                                        // Overwrite the default contentSnippet that gets returned with a cleaner version
                                        entry.contentSnippet = $(entry.content).first().html();
                                    });

                                    // Preload profile image and only show content thereafter
                                    $('<img src="' + self.image + '">').load(function() {
                                        loader.fadeOut(300, function() {
                                            loader.remove();
                                            self.init();
                                        });
                                    });
                                } catch (error) {
                                    loader.fadeOut(300, function() {
                                        loader.remove();
                                        wrapper.html('<div class="error">Unable to retrieve feed contents. <span class="retry">Retry</span></div>');
                                        wrapper.fadeIn(300); // Show the content

                                        // Retry button functionality
                                        wrapper.find('.retry').click(function() {
                                            wrapper.children().remove();
                                            wrapper.append(loader);
                                            loader.show();
                                            self.getFeed(); // Try again
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
