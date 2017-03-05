# floater v2.0

Super smooth & easy javascript floater on scroll, based on sticky-kit.

Supports 3d transitions if available with fallback to setting element's top position.

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
 
   - animate: true,false           # Sets element top animated or not
   - animationDuration: 150        # Sets the duration of the animation
   - transform:                    # If it is an empty string, top calc will be forced, otherwise it is set by floater
   - paddingTop: 0                 # Adds a padding to the element offsettop calc when setting top
   - paddingBottom: 0              # Adds a padding to the element offsetbottom calc when setting top
   - mediaUp: 768                  # Skips calc & top change under 768px
   - mediaDown: 768                # Skips calc & top change above 768px  
   - standby: true,false           # If true then recalc or changing top will be skipped

## Events

**floater:recalc** (global/target)
When sending global (document) event all floaters will recalc.
When sending targeted event only the target floater will recalc.

**floater:standby-on**
When sending global (document) event all floaters will skip recalc and changing top.
When sending targeted event only the target will skip recalc and changing top.

**floater:standby-off**
When sending global (document) event all floaters will start recalc and changing top on next scroll or *floater:recalc*.
When sending targeted event only the target will start recalc and changing top on next scroll or *floater:recalc*.

**floater:cache** (global/target)
When sending global (document) event all floaters will cache elements position & height.
When sending targeted event only the target floater will cache elements position & height.

## Usage example

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