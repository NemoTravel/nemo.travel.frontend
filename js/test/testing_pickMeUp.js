function prepareDateArray(){
    var dates = $('.dates-to-highlight').children();
    if (dates.length <= 0) {
        return {}
    } else {
        var datesArray = []
        for (var i = 0; i < dates.length; i++) {
            datesArray.push($(dates[i]).text());
        }
        return datesArray;
    }
}
$(function () {
    $('.js-picker-input_test').pickmeup({
        hideOnSelect:true
    });
    $('.js-picker-input_test_range').pickmeup({
        mode:'range'
    });
    $('.js-picker-input_test_calendars').pickmeup({
        calendars	: 2
    });
    $('.js-picker-input_test_callbacks').pickmeup({
        onSetDate:function(){
            alert('You clicked on:'+this.current);
        }
    });
    $('.js-picker-input_test_minimal').pickmeup({
        min:new Date,
        max:new Date(new Date().setMonth(new Date().getMonth()+1))
    });
    $('.js-picker-input_test_multi').pickmeup({
        mode:'multiple'
    });
	$('.js-picker-input_test_sunday').pickmeup({
        firstDay:0
    });
    $('.js-picker-input_test_highlight').pickmeup({
        calendars:1
    });
    $('.js-set-highlight-date').click(function(e) {
        e.preventDefault();
        $('.dates-to-highlight').append('<span>' + $('.js-date-to-highlight').val() + '</span>');
        $('.js-picker-input_test_highlight').pickmeup({
            highlightDates:prepareDateArray()
        })
    });
});
