$(function () {

	$(".js-menuButton").on("click", function(e){
		$("html").toggleClass("side-menu-open");
	});

	$(".js-overlay-menu").on("click", function(e){
		if($(e.target).hasClass("js-overlay-menu")){
			$("html").toggleClass("overlay-menu-open");
		}	
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
		minimumResultsForSearch: 500,
		width: "style"
	});

	$(".js-drop-select").on("click", function(){
		$(this).toggleClass("drop-open");
	});

	$(".js-selectList_item").on("click", function(e){
		var $this = $(this),
			$parent = $this.closest(".new-ui-selectList__main");
		if(!$this.hasClass("new-ui-selectList__main__item_selected")){
			$parent.find(".js-selectList_item").removeClass("new-ui-selectList__main__item_selected");
			$this.addClass("new-ui-selectList__main__item_selected");
		}
	});

	$(".js-flightSelect").on("click", function(){
		var $this = $(this);

		$this.toggleClass("new-flightSelect_open");
	});

	$(".js-tablet-filters").on("click", function(){
		$("html").toggleClass("nemo-root_asideShow");
	});

});