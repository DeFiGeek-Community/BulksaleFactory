interface ITemplateContract {
    event Initialized(bytes indexed abiBytes);

    function initialize(bytes memory abiBytes) external returns (bool);
}