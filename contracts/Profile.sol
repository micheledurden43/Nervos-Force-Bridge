pragma solidity >=0.8.0;

contract Profile {
 
  uint public totalWorker;

  mapping(uint => Worker) public workers;

  constructor() payable {
    totalWorker = 0;
  }

  struct Worker{
    uint id;
    string name;
    string title;
    string description;
    uint likes;
  }

  function createNewProfile(string memory _name,string memory _title,string memory _descr) external {
    require(bytes(_name).length > 2,"Invalid Name");
    require(bytes(_title).length > 2,"Invalid Title");
    require(bytes(_descr).length > 2,"Invalid Description");
    
    totalWorker++;
    workers[totalWorker] = Worker(totalWorker,_name,_title,_descr,0);
  
  }

  function likeProfile(uint _id) external{
    require(_id<=totalWorker,"Invalid id");
    workers[_id].likes++;
  }

  function getAllWorkers() public view returns(Worker[] memory){

    Worker[] memory _workers = new Worker[](totalWorker);
    uint currentIndex = 0;

    for(uint i=1; i<=totalWorker;i++){
      _workers[currentIndex] = workers[i];
      currentIndex++;
    }
    return _workers;
  }

}