
var CanvasUtil = require("./CanvasUtil.js");
var SMath = require("smath");

var sMath = new SMath({resolution:1200});

function Transform(imageDataOriginal, cacheFunction)
{
    'use strict';

    if (!(this instanceof Transform))
    {
        return new Transform(imageData);
    }

    var me = this;
    var imageDataModified;
    var cache;

    function init()
    {
        imageDataModified = imageDataOriginal;
        cache = createCache(imageDataOriginal);
    }

    Object.defineProperty(this, "imageData", {
        get: function()
        {
            return imageDataModified;
        }
    });

    /**
     * Perform transformation by remanipulating original data.
     * Can be used to appy only one transformation.
     */
    me.do = function(transformFn, parameters)
    {
        imageDataModified = transform(transformFn, parameters, imageDataModified, cache);
    };

    me.reset = function()
    {
        imageDataModified = imageDataOriginal;
    };

    function createCache(imageData)
    {
        var width = imageData.width;
        var height = imageData.height;
        var dataLength = width * height;
        var x;
        var y;

        var data = [];
        var c;

        for (var i = 0; i < dataLength; i++)
        {
            c = {
                x: (i % width),
                y: Math.floor(i / width)
            };

            if(cacheFunction)
            {
                cacheFunction(i, c);
            }

            data.push(c);
        }

        return data;
    }

    function transform(transformFn, parameters, imageDataSrc, cache)
    {
        var bufferSrc = imageDataSrc.data.buffer;
        var bufferDst = new ArrayBuffer(imageDataSrc.data.length);

        var uint32Src = new Uint32Array(bufferSrc);
        var uint32Dst = new Uint32Array(bufferDst);

        var uint8CSrc = new Uint8ClampedArray(bufferSrc);
        var uint8CDst = new Uint8ClampedArray(bufferDst);

        var imageDataDst = CanvasUtil.createImageData(imageDataSrc);

        var length = uint32Src.length;
        var width = imageDataSrc.width;
        var height = imageDataSrc.height;
        var result = [];

        for(var i = 0; i < length; i++)
        {
            transformFn(i, uint32Src, uint32Dst, parameters, width, height, cache);
        }

        imageDataDst.data.set(uint8CDst);

        return imageDataDst;
    }

    init();
}

Transform.Swirl = function(srcIndex, src32, dst32, p, width, height, cache)
{
    var pixelCache = cache[srcIndex];
    var originX = p.originX;
    var originY = p.originY;
    var radius = p.radius;

    var distanceX = pixelCache.x-originX;
    var distanceY = pixelCache.y-originY;
    var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY);

    var radian = p.angle * distance;

    var tx = (pixelCache.x + Math.cos(radian) * radius) | 0;
    var ty = (pixelCache.y + Math.sin(radian) * radius) | 0;

    if(tx < 0 || ty < 0 || tx > width-1 || ty > 800) {
        return;
    }

    dst32[srcIndex] = src32[ty * width + tx];
};

Transform.lens = function(srcIndex, src32, dst32, p, width, height, cache)
{
    var pixelCache = cache[srcIndex];
    var originX = p.originX;
    var originY = p.originY;
    var radius = p.radius;

    var distanceX = pixelCache.x-originX;
    var distanceY = pixelCache.y-originY;
    var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY);
    var radian = Math.atan2(distanceY, distanceX);

    var tx = (pixelCache.x + Math.cos(radian) * radius) | 0;
    var ty = (pixelCache.y + Math.sin(radian) * radius) | 0;

    if(tx < 0 || ty < 0 || tx > width-1 || ty > 800) {
        return;
    }

    dst32[srcIndex] = src32[ty * width + tx];
};

Transform.stereographicProjection = function(srcIndex, src32, dst32, p, width, height, cache)
{
    // original source code created by tom@subblue.com

    var PI = 3.141592653589793;
    var TWOPI = 6.283185307179586;
    var HALFPI = 1.570796326794897;
    var PI180 = 0.017453292519943;

    // props
    var outputWidth = width;
    var outputHeight = height;
    var centerX = p.centerX;
    var centerY = p.centerY;
    var longitude = p.longitude
    var latitude = p.latitude
    var rotate = p.rotate
    var zoom = p.zoom;
    var wrap = p.wrap;
    var twist = p.twist;
    var bulge = p.bulge;

    var ca = cache[srcIndex];

    var hwidth = width * 0.5;
    var hheight = height * 0.5;

    // var rc = Math.cos(radians(rotate));
    // var rs = Math.sin(radians(rotate));
    // float2x2 rotation = float2x2(rc, rs, -rs, rc);

    var px = (ca.x - outputWidth * 0.5 - centerX * outputWidth) / height;
    var py = (ca.y - outputHeight * 0.5 - centerY * outputHeight) / height;

    // p *= rotation;

    // Stereographic projection
    var r = Math.sqrt(px*px + py*py);
    var c = 2 * Math.atan2(r, 0.5 * (zoom + bulge));

    var cc = Math.cos(c);
    var sc = Math.sin(c);
    var cl = Math.cos(radians(latitude));
    var sl = Math.sin(radians(latitude));

    var lat = Math.asin(cc * sl + (py * sc * cl) / r) + (wrap * PI);
    var lon = radians(longitude) + Math.atan2(px * sc, (r * cl*cc - py * sl * sc));

    // Twist
    lon += twist * r * PI;

    // Wrap longitude
    lon = ((lon + PI) % TWOPI) - PI;

    if (wrap !== 0) {
        // Reflect the top and bottowrappingm to get smooth
        if (lat > TWOPI) {
            // Second inner sky reflection (+wrap)
            lat = Math.abs(lat) % HALFPI;

        } else if (lat > TWOPI - HALFPI) {
            // First inner sky reflection (+wrap)
            lat = (Math.abs(lat) % HALFPI) - HALFPI;

        } else if (lat > HALFPI) {
            // First ground reflection (+wrap)
            lat = PI - lat;

        } else if (lat < -TWOPI) {
            // Second outside sky reflection (-wrap)
            lat = -(Math.abs(lat) % HALFPI);

        } else if (lat < -TWOPI + HALFPI) {
            // Second outside ground reflection (-wrap)
            lat = HALFPI - (Math.abs(lat) % HALFPI);

        } else if (lat < -PI) {
            // First outside ground reflection (-wrap)
            lat = Math.abs(lat) % HALFPI;

        } else if (lat < -HALFPI) {
            // First outside sky reflection (-wrap)
            lat = -HALFPI + (Math.abs(lat) % HALFPI);
        }
    }

    // Convert back to equirectangular coordinates

    var radsx = PI / hwidth;
    var radsy = HALFPI / hheight;
    var tx = -lon / radsx;
    var ty = -lat / radsy;

    ty += bulge * r * hwidth;

    tx = hwidth - tx;
    ty = hheight - ty;

    // clamp
    if(tx < 0.5) {
        tx = 0.5;
    }
    if(ty < 0.5) {
        ty = 0.5;
    }
    if(tx > (width - 0.5)) {
        tx = width - 0.5;
    }
    if(ty > (height - 0.5)) {
        ty = height - 0.5;
    }

    tx = tx | 0;
    ty = ty | 0;

    dst32[srcIndex] = src32[ty * width + tx];
};

function radians(degrees) {
    return degrees * (Math.PI / 180);
}


Transform.descriptions = {
    Swirl: {
        arguments: [
            {
                name: "originX",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0,
                type: "number",
                description: "Center position of the transform on X axis."
            },
            {
                name: "originY",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0,
                type: "number",
                description: "Center position of the transform on Y axis."
            },
            {
                name: "angle",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0.0349,
                type: "number",
                description: "Angle of the twist in radians."
            },
            {
                name: "radius",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 20,
                type: "number",
                description: ""
            },
        ]
    }
};

module.exports = Transform;