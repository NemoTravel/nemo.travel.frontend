define(['js/vm/Models/RoomTariffsModel', 'js/vm/helpers'], function (RoomTariffsModel, helpers) {

    function SelectRoomsViewModel(ko) {

        var self = this;

        // выбранные тарифы
        self.selectedRoomsTariffs = ko.observable({});

        // массив комнат с таррифами
        self.allRooms = ko.observableArray([]);

        self.setHotel = function (newHotel) {

            var newRooms = [],
                tariffs = {};

            newHotel.rooms.forEach(function (roomTariffs, roomIndex) {
                newRooms[roomIndex] = new RoomTariffsModel(roomTariffs);
            });

            newRooms.forEach(function (room, index) {
                tariffs[index] = ko.observable(null);
            });

            self.allRooms(newRooms);
            self.selectedRoomsTariffs(tariffs);
        };

        self.isAllRoomsSelected = ko.computed(function () {

            var tariffs = self.selectedRoomsTariffs(),
                count = 0;

            helpers.iterateObject(tariffs, function (selectedRoomsTariff) {
                if (selectedRoomsTariff()) {
                    count++;
                }
            });

            return count === helpers.toArray(tariffs).length;
        });

        self.totalRoomsPrice = ko.computed(function () {

            if (!self.isAllRoomsSelected()) {
                return 0;
            }

            var price = 0;

            helpers.iterateObject(self.selectedRoomsTariffs(), function (selectedRoomTariffs) {
                if (selectedRoomTariffs()) {
                    price += Math.round(selectedRoomTariffs().rate.price.amount);
                }
            });

            return price;
        });

        self.selectRoom = function (roomIndex, roomTariff) {

            var selectedRoomTariff = self.selectedRoomsTariffs()[roomIndex];

            if (selectedRoomTariff()) {
                if (selectedRoomTariff() === roomTariff) {
                    selectedRoomTariff(null);
                } else {
                    selectedRoomTariff(null);
                    selectedRoomTariff(roomTariff);
                }
            } else {
                selectedRoomTariff(roomTariff);
            }

            self.selectedRoomsTariffs.notifySubscribers();
        };

        self.isRoomSelected = function (roomIndex, roomTariff) {
            return self.selectedRoomsTariffs()[roomIndex]() === roomTariff;
        };
    }

    return SelectRoomsViewModel;
});
