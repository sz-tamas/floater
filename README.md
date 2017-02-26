# floater v1.0

Super smooth &amp; easy jquery floater on scroll, based on sticky-kit.

## Options

Options can be set on the element where we want floater to bind to.

**data-component="floater"**

Binding floater to element.

**data-floater-container**: CSS Selector

This is the container of the element within we want the element to be floating on scroll.
 
**data-floater-parent**: CSS Selector

This is the relative parent to the element where we want the element to stick to when scroll.

*Optional:* If not set it is always the floating element's parent.

**data-floater-options**: JSON
 
   - animate: "true","false"       # Sets element top animated or not
   - paddingTop: 0                 # Adds a padding to the element offsettop calc when setting top
   - paddingBottom: 0              # Adds a padding to the element offsetbottom calc when setting top

## USAGE EXAMPLE

Install dependencies:
```
$ npm i
```

In this example we want floater to stick to relative parent (*floater-wrapper*) or the window.pageYOffset if scrolled down & parent is not visible. Floating element will be also stick to the bottom of the window or relative parent bottom if height is larger then window.innerHeight.   

Floating element will not float over the top or bottom of the relative parent or the content, it uses absolutie positioning to make sure it stick with parent position.

```
<section class="content">
    <div class="sidebar">
        <div class="floater-wrapper">
            <div class="floater"
                 data-component="floater"
                 data-floater-container=".content"
                 data-floater-parent=".floater-wrapper">
                <div>
                    floating content
                </div>
            </div>
        </div>
    </div>
    <div class="maincontent">
        fixed content
    </div>
</section>
```

**Multiple floaters**   

Because of floater uses absolute positioning it is up to the layout and our choice what element we want to be floated, so if we need we can make two element to be floating next to each other if they have their relative parent next to each other also. (see "multiplefloatwithdynamiccontent&fixednavbar2.html" for example)