$(function () {
    $('.js-picker-input_test').pickmeup({
        hideOnSelect:true,
		selectYear:true
    });
    $('.js-picker-input_test_range').pickmeup({
        mode:'range'
    });
    $('.js-picker-input_test_calendars').pickmeup({
        calendars: 2
    });
    $('.js-picker-input_test_callbacks').pickmeup({
        onSetDate:function(){
            alert('You clicked on:'+this.current);
			return true
        }
    });
    $('.js-picker-input_test_minimal').pickmeup({
        min:new Date,
        max:new Date(new Date().setMonth(new Date().getMonth()+1)),
	    onSetDate:function(){
		    alert('You clicked on:'+this.current);
		    return true
	    }
    });
    $('.js-picker-input_test_multi').pickmeup({
        mode:'multiple',
		separator:'&'
    });
	$('.js-picker-input_test_sunday').pickmeup({
        firstDay:0,
		prev:'p',
		next:'n'
    });
	$('.js-picker-input_test_years').pickmeup({
		view:'years',
		format:'d/m/Y',
		position:'left'
    });
	$('.js-picker-input_test_ondblclick').pickmeup({
		triggerEvent:'dblclick'
    });
	$('.js-picker-input_test_highlight').pickmeup({
        render:function(){
			var today = new Date().setHours(0,0,0,0);
			if (arguments[0].getTime() ==new Date(today).getTime()){
				return {className:'nemo-pmu-highlight', disabled:true}
			}
		}
    });
});
