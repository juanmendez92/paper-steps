var el, form, i, item, items, _items, len, steps, step;

suite('<paper-step>', function() {

  setup(function() {
    step = fixture('paper-step-fixture');
  });

  test('default step is 1', function() {
    assert.equal(step.step, 1);
  });

});

suite('<paper-steps> submit button', function() {

  setup(function() {
    el = item = null;
    i = len = 0;
    steps = fixture('paper-steps-fixture-submit');
    items = steps.$.steps_content.items;
  });

  test('paper-button continue is disabled / re-enabled on submit.', function() {

    async.series([
      function () {
        item = items[0];
        item.$.continue.click();
      },
      function () {
        //non-deterministic method of testing disabled state
        assert.equal(this.$.continue.disabled, true);
      },
      function () {
        //event is debounced, so wait
        assert.equal(this.$.continue.disabled, false);
      }
    ]);
  });

});

suite('<paper-steps> linear behavior', function() {

  setup(function() {
    item = null;
    steps = fixture('paper-steps-fixture-linear');
    items = steps.$.steps_content.items;
  });

  test('linear does not loop back to first step on complete.', function() {
    // last step
    item = items[items.length-1];

    async.series([
      function() {
        item.$.continue.click();
      },
      function() {
        epect(steps.$.selector.selected).to.be.equal(item);
      }
    ]);
  });

});

suite('<paper-steps> properties and defaults', function() {

  setup(function() {
    el = item = null;
    i = len = 0;
    steps = fixture('paper-steps-fixture');
    items = steps.$.steps_content.items;
    _items = steps.$.selector.$$('template').items; //horizontal
  });

  test('defaults to horizontal display.', function() {
    assert.equal(steps._vertical, false);
    assert.equal(steps._horizontal, true);
    assert.equal(steps._cssClass, 'horizontal');
  });

  test('defines the "label" property.', function() {
    assert.equal(items[0].label, 'step 1');
    assert.equal(items[1].label, 'step 2');
    assert.equal(items[2].label, '');
  });

  test('default steps are: 1, 2, and 3.', function() {
    assert.equal(items[0].step, 1);
    assert.equal(items[1].step, 2);
    assert.equal(items[2].step, 3);
  });

  test('adds first/last optional/required classes.', function() {
    for (i=0, item, len=items.length; i<len; i++) {
      item = items[i];
      el = item.$.step_content;

      switch (i) {
        case 0:
          assert.equal(item._cssClass, 'optional-step first ');
          assert.isTrue(el.classList.contains('first'));
          assert.isTrue(el.classList.contains('optional-step'));
          assert.isFalse(el.classList.contains('last'));
          assert.isFalse(el.classList.contains('required-step'));
          break;
        case 1:
          assert.equal(item._cssClass, 'required-step ');
          assert.isTrue(el.classList.contains('required-step'));
          assert.isFalse(el.classList.contains('first'));
          assert.isFalse(el.classList.contains('last'));
          assert.isFalse(el.classList.contains('optional-step'));
          break;
        case 2:
          assert.equal(item._cssClass, 'required-step last ');
          assert.isTrue(el.classList.contains('last'));
          assert.isTrue(el.classList.contains('required-step'));
          assert.isFalse(el.classList.contains('first'));
          assert.isFalse(el.classList.contains('optional-step'));
          break;
      }
    }
  });

  test('can be editable, optional, and selectable.', function() {
    var
      editable = [true, false, false],
      optional = [true, false, false],
      selectable = [true, true, true]
    ;

    //editable
    for (i=0, item, len=items.length; i<len; i++) {
      item = editable[i];
      assert.equal(items[i].editable, item);
      assert.equal(_items[i].editable, item);
    }

    //selectable
    for (i=0, item, len=items.length; i<len; i++) {
      item = selectable[i];
      assert.equal(items[i].selectable, item);
      assert.equal(_items[i].selectable, item);
    }

    //optional
    for (i=0, item, len=items.length; i<len; i++) {
      item = optional[i];
      assert.equal(items[i].optional, item);
      assert.equal(_items[i].optional, item);
    }
  });

  test('[linear] progression.', function() {
    var selector = steps.$.selector;
    for(i=1, len=items.length; i<len; i++) {
      selector.select(i);
      expect(selector.selected).to.not.equal(0);
    }

    steps.linear = false;
    for(i=1, len=items.length; i<len; i++) {
      selector.select(i);
      expect(selector.selected).to.equal(i);
    }
  });
});

suite('<paper-steps> events', function() {

  setup(function() {
    el = item = form = null;
    i = len = 0;
    steps = fixture('paper-steps-fixture');
    items = steps.$.steps_content.items;
    _items = steps.$.selector.$$('template').items; //horizontal
    item = items[0];
    form = item._getForm();
  });

  test('is complete after skip pressed.', function() {

    async.series([
      function() {
        item = items[0];
        //initially undefined
        expect(item.lastErrorResponse).to.be.undefined;
        expect(item.lastSuccessResponse).to.be.undefined;
      },
      function() {
        item.$.skip.click();
      },
      function() {
        //event is debounced, so wait 300ms.
        assert.equal(item.completed, true);
        expect(item.data).to.be.equal({});
        expect(item.lastErrorResponse).to.be.undefined;
        expect(item.lastSuccessResponse).to.be.undefined;
        // item.async(function() {
        // }, 500);
      },
    ]);
  });

  test('is complete after continue pressed.', function() {
    var selector = steps.$.selector;

    async.series([
      function() {
        item = items[0];
        //initially undefined
        expect(item.lastErrorResponse).to.be.undefined;
        expect(item.lastSuccessResponse).to.be.undefined;
      },
      function() {
        item.$.continue.click();
      },
      function() {
        //event is debounced, so wait 300ms.
        assert.equal(item.completed, true);
        expect(item.data).to.be.equal(item._getForm().serialize());
        expect(item.lastErrorResponse).to.be.undefined;
        expect(item.lastSuccessResponse).to.be.not.ok;
      },
      function() {
        selector.select(0);
      },
      function() {
        expect(selector.selected).to.be.equal(0);
        expect(steps.$.steps_content.selected).to.be.equal(0);

        //edit input, will trigger complete=false
        input.value = 'testing';
      },
      function() {
        expect(item.completed).to.be.equal(false);

        item.$.continue.click();
      },
      function() {
        expect(item.completed).to.be.equal(true);
        expect(selector.selected).to.be.equal(1);
        expect(steps.$.steps_content.selected).to.be.equal(1);
      },
    ])

  });

  test('paper-button only triggers one event: submit, reset, skip.', function() {
    sinon.spy(form, "reset");

    async.series([
      function() {
        //trigger reset click event 100's
        for (i=0, len=100; i<len; i++) {
          item.$.reset.click();
        }
      },
      function() {
        assert(form.reset.calledOnce);
        form.reset.restore(); //unwrap
      },
      function() {
        //trigger submit click event 100's
        sinon.spy(form, "submit");
        for (i=0, len=100; i<len; i++) {
          item.$.continue.click();
        }
      },
      function() {
        assert(form.submit.calledOnce);
        form.submit.restore(); //unwrap
      },
      function() {
        //trigger skip click event 100's
        sinon.spy(form, "reset");
        for (i=0, len=100; i<len; i++) {
          item.$.skip.click();
        }
      },
      function() {
        assert(form.reset.calledOnce);
        form.reset.restore(); //unwrap
      },
    ]);

  });
});

suite('<paper-steps> with iron-selector inputs', function() {

  setup(function() {
    el = item = form = null;
    i = len = 0;
    steps = fixture('paper-steps-iron-selectors');
    items = steps.$.steps_content.items;
    _items = steps.$.selector.$$('template').items; //horizontal
    form = items[0].$.step_content.querySelector('form[is="iron-form"]');
    item = items[0];
  });

  test('ignores inputs which implement iron-slector behavior', function() {
    var triggered = false;
    steps.addEventListener('iron-activate', function(e) {
      triggered = true;
    });

    steps.$.selector.select(1);
    expect(triggered).to.be.equal(false);
    expect(steps.$.selector.selected).to.be.equal(1);
    // debugger;
  });
});

suite('<paper-steps> messages', function() {

  setup(function() {
    el = item = form = null;
    i = len = 0;
    steps = fixture('paper-steps-fixture');
    items = steps.$.steps_content.items;
    _items = steps.$.selector.$$('template').items; //horizontal
    form = items[0].$.step_content.querySelector('form[is="iron-form"]');
  });

  test('showMessage displays paper-toast pop up.', function() {
    sinon.spy(steps.$.messages, "show");
    steps.showMessage('Testing', 'success');
    assert(steps.$.messages.show.calledOnce);
  });

});

suite('<paper-steps> editable', function() {
  setup(function() {
    el = item = form = null;
    i = len = 0;
    steps = fixture('paper-steps-fixture-editable');
    items = steps.$.steps_content.items;
    form = items[0].$.step_content.querySelector('form[is="iron-form"]');
  });

  test('state can be editable, optional, and selectable', function() {
    //steps: optional (1st) -> editable (2nd)-> [standard] (3rd)
    async.series([
      function() {
        item = items[0];
        assert.equal(item.selectable, true);
        item.$.skip.click(); //skip this step
      },
      function() {
        // skip 1st step, non-editable (non-selectable)
        assert.equal(item.selectable, false);
        steps.$.steps_content.select(item);
        assert.equal(steps.$.steps_content.selected, 1);
      },
      function() {
        // submit 2nd step, editable (selectable)
        item = items[1];
        assert.equal(item.editable, true);
        assert.equal(item.selectable, true);
        item.$.continue.click(); //submit this step
      },
      function() {
        assert.equal(item.selectable, true);
        steps.$.steps_content.select(item);
        assert.equal(steps.$.steps_content.selected, 1);
      }
    ])
  });

});

suite('<paper-steps> initial-steps', function() {

  setup(function() {
    el = item = form = null;
    i = len = 0;
    steps = fixture('paper-steps-fixture-initial-step');
    items = steps.$.steps_content.items;
  });

  test('begins on step #3', function() {
    var
      _steps = steps
    ;

    async.series([
      function() {
        // listen for ready event
        steps.listen(_steps, 'paper-steps-ready', function(e) {
          assert.equal(this.initializing, false);
          assert.equal(this.$.steps_content.selected, 2);
          assert.equal(this, e.detail);

          for (i=0, len=2; i<len; i++) {
            assert.equal(items[i].completed, true);
          }
        });
      },
      function() {
        // wait delay for initialization to finish
        assert.equal(_steps.initializing, false);
        assert.equal(_steps.steps.$.steps_content.selected, 2);
      }
    ]);
  });

  test('sets initial values', function() {
    var
      initial = [
        {'test-step-1': 'one', 'test-step-1-2': null},
        {'test-step-2': 'two'},
        {'test-step-3': 'three'}
      ]
    ;

    async.series([
      function() {
        steps.initial = initial;
      },
      function() {
        item = items[0];
        form = item._getForm();

        expect(form.serialize()).to.be.equal({
          'test-step-1': 'one', 'test-step-2': 'foo bar'
        })

        item = item[1];
        form = item._getForm()

        expect(form.serialize()).to.be.equal({
          'test-step-2': 'two'
        })

        item = item[2];
        form = item._getForm();

        expect(form.serialize()).to.be.equal({
          'test-step-3': 'three'
        })
      }
    ])
  });

  test('is all clean after reset()', function() {
    var
      _steps = steps,
      selector = steps.$.selector
    ;

    async.series([
      function() {
        // listen for ready event
        steps.listen(_steps, 'paper-steps-ready', function(e) {
          assert.equal(this.$.steps_content.selected, 2);

          for (i=0, len=2; i<len; i++) {
            assert.equal(items[i].completed, true);
          }
        });
      },
      function() {
        steps.reset();
      },
      function() {
        for (i=0, len=2; i<len; i++) {
          assert.equal(items[i].completed, false);
          assert.equal(selector.items[i].completed, false);
        }
      }
    ]);
  });

});
