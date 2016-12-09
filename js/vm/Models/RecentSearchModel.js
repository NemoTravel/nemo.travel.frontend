define(['js/vm/helpers', 'js/vm/Models/LocalStorage'], function (helpers, LocalStorage) {

    function RecentSearchModel() {

    }

    var LOCAL_STORAGE_KEY = 'recentSearches';

    // returns last 3 elements from array in original order
    function getLasThreeSearches() {
        var getLastCount = 3;
        return LocalStorage.get(LOCAL_STORAGE_KEY, []).reverse().splice(0, getLastCount).reverse();
    }

    RecentSearchModel.add = function (searchId, searchData) {

        var lastSearches = getLasThreeSearches();

        if (!helpers.findObjectInArrayByProperty(lastSearches, 'searchId', searchId)) {

            if (lastSearches.length === 3) {
                lastSearches.shift();
            }

            searchData.searchId = searchId;
            lastSearches.push(searchData);
        }

        LocalStorage.set(LOCAL_STORAGE_KEY, lastSearches);
    };

    RecentSearchModel.getLast = function () {
        return getLasThreeSearches();
    };

    return RecentSearchModel;
});
