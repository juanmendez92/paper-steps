'use strict';
Polymer({
  is: "paper-step",
  properties: {
    /**
     * Computed css classes based on the current `step` and the total
     * number value of `steps`.
     */
    _cssClass: {
      type: String,
      computed: '__cssClass(step, steps)'
    },
    /**
     * Computed for the `paper-step` image icon based on the supplied `icon`
     * attribute and the `completed` property.
     */
    _image: {
      type: String,
      computed: '_icon(editable)'
    },
    /**
     * Indicates if the current `paper-step` is selected and toggles the
     * active/inactive css style rules.
     */
    _selected: {
      type: Boolean,
      value: false
    },
    /**
     * If true, the submit buttons which are automatically
     * added will be hidden for this `paper-step` element.
     */
    actionsDisabled: {
      type: Boolean
    },
    /**
     * If true, the current step has been validated and marked as done.
     */
    completed: {
      type: Boolean,
      value: false,
      reflectToAttribute: true,
      observer: '_onComplete'
    },
    /**
     * Specify an alternate label to use for the `continue` button.
     */
    continueLabel: {
      type: String,
      value: 'Continue'
    },
    /**
     * A copy of the serialized form data for the last successful submit.
     */
     data: Object,
    /**
     * Used internally to debouce custom events:
     * `paper-step-complete`, and `paper-step-next`.
     */
    duplicate: {
      type: Boolean,
      value: false
    },
    /**
     *
     */
    editable: {
      type: Boolean,
      value: false,
      reflectToAttribute: true
    },
    /**
     * An object of initial values for this `paper-step`, the object should be
      * name value pairs which correspond to the form input names.
     */
    initial: {
      type: Object,
      observer: '_onChangeInitial'
    },
    /**
     * The text to display in the steps area next to the image icon.
     */
    label: {
      type: String
    },
    lastErrorResponse: Object,
    lastSuccessResponse: Object,
    /**
     * To indicate if the current step required or optional.
     */
    optional: {
      type: Boolean,
      value: false
    },
    /**
     * Specify an alternate label to use for the `reset` button.
     */
    resetLabel: {
      type: String,
      value: 'Reset'
    },
    selectable: {
      type: Boolean,
      computed: '_selectable(completed, editable)',
      reflectToAttribute: true
    },
    skipLabel: {
      type: String,
      value: 'Skip'
    },
    /**
     * The 1 based index value for the current `paper-step` in `paper-steps`.
     *
     * `Automatically calculated`.
     */
    step: {
      type: Number
    },
    /**
     * The value for the total number of `paper-step` elements (readonly).
     *
     * `Automatically calculated`.
     */
    steps: {
      type: Number
    }
  },
  behaviors: [],
  listeners: {
    //error after submit, IronRequestElement in event.detail object
    'iron-form-error': '_onResponse', //'_onError',

    //cannot submit, form is invalid

    // 'iron-form-invalid': '',
    'iron-form-presubmit': '_onPreSubmit',

    // //after form is reset
    // 'iron-form-reset': '_reset',

    //after form submitted, IronRequestElement inevent.detail object
    'iron-form-response': '_onResponse',
    'iron-form-submit': '_onSubmit', //after submitted
    'continue.tap': '_submit',
    'reset.tap': '_reset',
    'skip.tap': '_skip'
  },

  // Element Lifecycle
  ready: function() {},

  attached: function() {
    var
      parent = this.parentNode && this.parentNode.indexOf && this.parentNode || null,
      form = this._getForm()
    ;

    // @TODO: finish adding fallback for shadowDom, not yet ready.
    if (!Boolean(parent) && this.shadowRoot) {
      try {
        parent = this.parentNode.$.selector;
      } catch (e) {
        parent = null;
      }
    }

    // debugger;
    if (!parent || parent.hasOwnProperty('indexOf') || typeof parent.indexOf != 'function') {
      this.step = 1;
      this.steps = 1;
      try {
        console.log('Improperly declared paper-step element, ' +
          'it is missing the parent iterator.');
      } catch (e) {}
      return;
    }

    if (!Boolean(this.step)) {
      this.step = parent.indexOf(this) + 1;
    }

    if (!Boolean(this.steps)) {
      this.steps = parent.items.length;
    }

    if (form && Polymer.isInstance(form)) {
      var i, child, len,
        children = form.getEffectiveChildren()
      ;
      for (i=0, len=children.length; i<len; i++) {
        child = children[i];
        this.listen(child, 'keyup', '_onChange');
      }
      this.listen(form, 'iron-activate', '_onActivate');
    }
  },

  detached: function() {},

  /**
   * Computes `_cssClass` property.
   * @return {string}.
   */
  __cssClass: function(step, steps) {
    var cls = (this.optional ? 'optional' : 'required') + '-step ';

    if (step === 1) {
      cls += 'first ';
    }
    if (step === steps) {
      cls += 'last ';
    }

    return cls;
  },
  /**
   * Attempts to retrieve the `iron-form` element for the current `paper-step`.
   */
  _getForm: function() {
    var
      el = Polymer.dom(this),
      form = el && el.node &&
        el.node.querySelector('form[is="iron-form"]')
    ;
    // debugger;
    return form || false;
  },
  /**
   * Attempts to retrieve the `submit` button for the current `paper-step`.
   */
  _getPrimaryButton: function() {
    var el, button;
    if (this.actionsDisabled) {
      el = this._getForm();
      if (el) {
        el = Polymer.dom(el).node.querySelectorAll(
          'button,paper-button,input[type="submit"]');
        button = el && el.length && el[0];
        if (button) {
          return button;
        }
      }
    } else {
      return this.$.continue;
    }
    return undefined;
  },
  /**
   * Computes `image` property based on step `icon` and current `step`.
   */
  _icon: function(editable) {
    if (editable) {
      return 'icons:create';
    }
    return 'icons:check';
    // return 'image:brightness-1';
  },
  /**
   * Event handler to ignore form elements which trigger any iron-select
   * events.
   */
  _onActivate: function(e) {
    //ignore iron-selector events from form children
    e.stopPropagation();
  },
  /**
   * Event handler to change the completed state of a `paper-step` once
   * any form inputs are changed.
   */
  _onChange: function(e) {
    if (this.completed) {
      this.completed = false;
    }
  },
  /**
   *
   */
  _onChangeInitial: function(_new, _old) {
    var
      i, len, input, elems, key, value,
      changed = [],
      form = this._getForm(),
      initial = _new,
      allowedInput = function(value) {
        return value !== undefined && value !== null;
      }
    ;

    // _new instanceof Object
    if (form && Boolean(initial) && initial instanceof Object) {
      elems = form.elements;

      // loop over form.elements and set inputs with non-empty name value from
      // initial object
      for (i=0, len=elems.length; i<len; i++) {
        input = elems[i];

        // if input.name != "" then set it with input.value = 'value'
        if (Boolean(input) && input.name != "") {
          try {
            value = initial[input.name] || null;
            if (allowedInput(value)) {
              if (Polymer.isInstance(input)) {
                input.set('value', value);
                input.fire('blur', value);
              } else {
                input.value = value;
              }
              changed.push(input.name);
            }
          } catch (e) {
            // console.log('Error while setting initial for "'+ input.name +'": ' + e);
          }
        }
      }

      // loop over name value pairs
      for (key in initial) {
        input = form.querySelector('[name="'+ key +'"] input');
        value = initial[key] || null;
        if (allowedInput(value) && Boolean(input) && !changed.includes(key)) {
          try {
            if (Polymer.isInstance(input)) {
              input.set('value', initial[key]);
              input.fire('blur', value);
            } else {
              input.value = initial[key];
            }
          } catch (e) {
            // console.log('Error while setting initial for "'+ input.name +'": ' + e);
          }
        }
      }
    }
  },
  /**
   * Notify parent of completed state change.
   */
  _onComplete: function(_new, _old) {
    if (this.duplicate === false) {
      if (_new === true) {
        this.fire('paper-step-complete', this.step);
        this.fire('paper-step-next', this.step);
      } else if (_new === false) {
        this.fire('paper-step-incomplete', this.step);
      }
    }
  },
  /**
   *
   */
  _onError: function(e) {},
  /**
   *
   */
  _onPreSubmit: function(e) {
    var
      form = this._getForm()
    ;

    if (this.completed) {
      e.preventDefault();
      this.fire('paper-step-already-complete', this);
    }
  },
  /**
   * Handles iron form events for `iron-form-error` and `iron-form-response`.
   */
  _onResponse: function(e) {
    var
      el = this._getPrimaryButton(),
      request = e && e.detail || false
    ;

    if (Polymer.isInstance(el) && el.disabled !== undefined) {
      el.disabled = false;
    }
    if (request && request.status === 200) {
      this.lastSuccessResponse = request;
      try {
        this.data = this._getForm().serialize();
      } catch (ex) {
        this.data = {}
      }
      this.completed = true;
    } else {
      this.lastErrorResponse = request;
    }
  },
  /**
   * Hooks into the `iron-form-submit` event to disable the form submit button.
   */
  _onSubmit: function(e) {
    var
      el = this._getPrimaryButton()
    ;

    if (Polymer.isInstance(el) && el.disabled !== undefined) {
      el.disabled = true;
    }
  },
  /**
   */
  _selectable: function(completed, editable) {
    return editable || !completed;
  },
  /**
   * When the `Reset` button is pressed, this restores the form elements
   * to their initial state by calling `form.reset()`.
   */
  _reset: function(e) {
    var
      event = e,
      that = this,
      form
    ;

    this.debounce('paper-step-reset', function() {
      form = that._getForm();
      // reset form if it exists.
      if (form) {
        //TODO: confirm?

        //then reset
        form.reset();
        that.completed = false;
      }
    }, 300);
  },
  /**
   * When the `Skip` button is pressed, this will the `_reset()` method,
   * and set the current `paper-step.completed` property to `true`, and then
   * advance to the next `paper-step` element.
   */
  _skip: function(e) {
    var
      event = e,
      that = this,
      form
    ;
    //reset form
    this._reset(e);

    this.debounce('paper-step-skip', function() {
      this.completed = true;
    }, 300);
  },
  /**
   * When the `Continue` button is pressed, check if form is valid
   * and then trigger the form `submit` event.
   */
  _submit: function(e) {
    var
      event = e,
      that = this,
      form
    ;
    // collapse multiple submissions and only trigger once.
    this.debounce('paper-steps-submit', function() {
      form = that._getForm();
      // submit form if it exists.
      if (form) {
        form.submit();
      }
    }, 300);
  }
});
