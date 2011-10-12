function TextBox(elem) {
    this.elem = $(elem);
}

TextBox.prototype.text = jpvs.property({
    get: function () { return this.elem.val(); },
    set: function (value) { this.elem.val(value); }
});

TextBox.prototype.bind = jpvs.bind();