$(function () {

	$(".js-menuButton").on("click", function(e){
		$("html").toggleClass("side-menu-open");
	});

	$(".js-overlay-menu").on("click", function(e){
		$("html").toggleClass("overlay-menu-open");
	});

	$(".js-dropMobile").on("click", function(){
		var $this = $(this);
		$("[data-menu-drop='"+ $this.data("menu") +"']").toggleClass("dropMobile-open");
	});

	$(".js-closeDropMobile").on("click", function(){
		var $this = $(this);
		$this.closest(".new-ui-dropMobile-drop").removeClass("dropMobile-open");
	});

	$(".js-custom-select select").select2({
		templateResult: function(state){
			console.log(state.element);
		}
	});
});