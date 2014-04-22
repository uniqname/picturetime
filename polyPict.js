(function() {
    window.addEventListener("DOMContentLoaded", function() {
        //Use live-node-lists here so we don't have to query the DOM everytime polyPict runs.
        var picturesLNL = document.getElementsByTagName("picture"),
            imgLNL = document.getElementsByTagName("img"),

            // renders an element with the slected `size` -- which may be
            // in relative units to get acutal px width used to selected
            // srcset url with closest w descriptor width.
            size2Px = (function() {
                var testEl = document.createElement("div");

                testEl.style.position = "absolute";
                testEl.style.zIndex = -1000;
                testEl.style.height = 0;
                testEl.style.opacity = 0;
                document.body.appendChild(testEl);

                return function(size) {
                    testEl.style.width = size;
                    return parseInt(window.getComputedStyle(testEl).width, 10);
                };
            })(),

            devicePxRatio = window.devicePixelRatio || 1,

            parseAttrSizes = function(sizes) {
                var parsed = {},
                    mq,
                    size;

                sizes = sizes.split(/,\s*/);

                sizes.forEach(function(sizePair) {
                    sizePair = sizePair.split(/\)\s*/);


                    if (sizePair.length === 1) {
                        //a blank or white-space only mq is always true,
                        // so we use this as the fallback mq;
                        parsed[" "] = sizePair[0];

                    } else if (sizePair.length === 2) {
                        parsed[sizePair[0] + ")"] = sizePair[1];
                    }
                });

                return parsed;
            },

            parseAttrSrcset = function(srcset) {
                var parsed = {},
                    src,
                    w,
                    res;

                srcset = srcset.split(/,\s*/);

                srcset.forEach(function(srcPair) {
                    var w, res,
                        properProperty = function(value, srcsetObj) {
                            if (value.match(/w$/)) {
                                srcsetObj.width = parseInt(value.replace(/w$/, ""), 10);
                            } else if (value.match(/x$/)) {
                                srcsetObj.pixelRatio = parseFloat(value.replace(/x$/, ""));
                            }
                        };

                    srcPair = srcPair.split(/\s+/);

                    if (srcPair.length === 1) {
                        parsed.
                        default = {};
                        properProperty(srcPair[0], parsed.
                            default);
                    } else if (srcPair.length === 2) {
                        parsed[srcPair[0]] = {};
                        properProperty(srcPair[1], parsed[srcPair[0]]);
                    }
                });

                return parsed;
            },

            polyPict = function() {

                //unique list of images with either sizes or srcset attrs.
                var pictyImgs = Array.prototype.filter.call(imgLNL, function(img) {
                    return img.getAttribute("sizes") != void 0;
                }),

                    getFinalSrc = function(source) {
                        var sizes = parseAttrSizes(source.getAttribute("sizes")),
                            mqs = Object.keys(sizes),
                            mq = mqs.find(function(mq) {
                                return matchMedia(mq).matches;
                            }),
                            //note mq's companion `size` from selected <source> || <img>
                            //convert `size` to px -- this is the desired img src size
                            size = size2Px(sizes[mq]),

                            src, w, x,
                            currentW, currentX,
                            finalSrc;

                        if (mq) {

                            //from matched <source> || <img>
                            srcset = parseAttrSrcset(source.getAttribute("srcset"));

                            for (src in srcset) {

                                if (srcset.hasOwnProperty(src)) {
                                    //if `srcset` attr has `w` descriptors
                                    if (srcset[src].width) {

                                        currentW = srcset[src].width;
                                        w = w == null ? currentW : w;
                                        finalSrc = finalSrc || src;

                                        //find `w` descriptor that has smallest value > `size`
                                        if (currentW >= size && (currentW < w || !w)) {
                                            w = currentW;

                                            //use companion `src` as controlling <img /> src.
                                            finalSrc = src;
                                        }

                                        //if `srcset` attr has device-pixel-ratio descriptors (`x`)
                                    } else if (srcset[src].pixelRatio) {

                                        currentX = srcset[src].pixelRatio;

                                        //find `x` descriptor that has smallest value > device-px-ratio
                                        if (currentX >= devicePxRatio && (crrentX < x || !x)) {
                                            x = currentX;
                                            //use companion `src` as controlling <img /> src.
                                            finalSrc = src;
                                        }
                                    }
                                }
                            }
                            if (this.src !== finalSrc) {
                                this.src = finalSrc;
                                this.currentSrc = finalSrc;
                            }
                        }
                        return mq;
                    };

                pictyImgs.forEach(function(img) {
                    getFinalSrc.call(img, img);
                });

                Array.prototype.slice.call(picturesLNL, 0).forEach(function(pic) {
                    // we reverse the array to select the last match first.
                    var controllingImg = pic.querySelector("img"),
                        sources = Array.prototype.slice.call(pic.querySelectorAll("source"), 0).reverse();

                    //select last <source> with matching mq in `sizes` attr
                    sources.find(getFinalSrc, controllingImg);
                });
            };

        polyPict();

        window.addEventListener("resize", polyPict);
    });
})();