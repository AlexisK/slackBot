Задача на Pure JS/Backbone/AngularJS/anything (на выбор, но предпочитаем AngularJS 2):

Система парковки.
У тебя есть Х парковочных мест (допустим 30), из них Х мест (допустим 10) для грузовых машин (большие парковочные места) и еще Х мест (допустим 5) для инвалидных машин.

Когда машина заезжает на парковку, у нее есть тип Sedan, Disabled или Truck.
На инвалидных местах, могут парковаться только инвалидные машины
На обычных местах могут парковаться только обычные машины или инвалидные
На грузовых местах могут парковаться все виды машин, но приоритет инвалидкам и грузовым для начала
Машина получает парковочное место, которое она резервирует за собой

Используя ООР, опиши парковку и машины. Храни состояние в cookie / localStorage.
Реализуй публичный интерфейс для парковки и машины - что бы можно было вызывать методы и проверять работоспособность кода.

Важно реализовать метод проверки общего состояния парковки, какие места заняты какими машинами.

После попробуй реализовать следующее:
Отрисовать визуально парковку (достаточно квадратов в разными цветами) и отображать их состояние по ходу наполнения машинами.

Под конец очень хотелось бы увидеть создать рандомайзер, который будет забивать и разгружать парковку, выводя статус например в консоль, посмотреть как работает логика.

Бонусом будет визуальный аспект который отображает состояние парковки.

Мне важно увидеть следующие элементы реализации:
Архитектурное решение кода, ООП, структура файлов если возможно, делегация событий если будет присутствовать визуальный элемент, паттерн вроде Observer/PubSub.
