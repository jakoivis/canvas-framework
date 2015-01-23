Library that brings some features for handling graphics on canvas.

========

##Main Features
* Easy way for adding, removing, moving graphical elements on canvas 
* Mouse events for graphical elements (onRollOver, onRollOut, onClick)
* Customizable pixel transformations

##Why to use this library instead of some other
I cannot think of any reason for you to use this library. This is library doesn't have that many features. It is not performing well on animations. There is at least one bug. This first release will be just a basic implementation which suits my needs. Lets see what there will be on future releases.

##Examples

Mouse event example
```js

var imageData = ... // use image-loader library to get some images

var layer = new Layer({
  appendToBody: true,
  fullScreen: true,
});

var graphic = new Graphic({
    imageData: imageData,
    onClick: clickHandler,
    onRollOver: rollOverHandler,
    onRollOut: rollOutHandler,
    x: 10,
    y: 10,
});

layer.addGraphic(graphic);
layer.render();

function clickHandler(){console.log("onClick");}
function rollOverHandler(){console.log("onRollOver");}
function rollOutHandler(){console.log("onRollOut");}

```
