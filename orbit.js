import P5Behavior from 'p5beh';

var usersAngles = {};
var clusterAngles = {};
var userColor = {};

const pb = new P5Behavior();
const radius = 50;

pb.draw = function (floor, p) {
  this.clear();
  for (let index in floor.users){
    let user = floor.users[index];
    let nearByUsers = findUsersCloseBy(floor, user);
    if(nearByUsers.length > 0){
      nearByUsers.push(user);
      let clusterInfo = findAllInCluster(floor, nearByUsers);
      let cluster = clusterInfo[0];
      let clusterId = clusterInfo[1];
      if(!(clusterId in clusterAngles)){
        let angles = [];
        for(var i = 0; i < (cluster.length * 5); i++){
          angles.push(i/(cluster.length * 5));
        }
        clusterAngles[clusterId] = angles;
      }
      for (let z in cluster){
        let user = cluster[z];
        if(!(user.id in usersAngles)){
          usersAngles[user.id] = [0, .2, .4, .6, .8];
          userColor[user.id] = [Math.floor((Math.random() * 255)), Math.floor((Math.random() * 255)), Math.floor((Math.random() * 255))];
        }
        this.fill(userColor[user.id])
        this.ellipse(user.x, user.y, 30);
      }
      const info = getCenterPointAndRadius(cluster);
      const centerX = info[0][0];
      const centerY = info[0][1];
      const currentRadius = info[1];
      for (var x = 0; x < clusterAngles[clusterId].length; x++){
        clusterAngles[clusterId][x] = (clusterAngles[clusterId][x] + 1/50) % 1
        let color = userColor[cluster[x % cluster.length].id];
        this.fill(this.color(color[0], color[1], color[2]));
        this.ellipse(currentRadius * Math.cos(Math.PI * clusterAngles[clusterId][x] * 2) + centerX, currentRadius * Math.sin(Math.PI * clusterAngles[clusterId][x] * 2) + centerY, 15)
      }
    }
    else{
      if(!(user.id in usersAngles)){
        usersAngles[user.id] = [0, .2, .4, .6, .8];
        userColor[user.id] = [Math.floor((Math.random() * 255)), Math.floor((Math.random() * 255)), Math.floor((Math.random() * 255))];
      }
      this.fill(userColor[user.id])
      this.ellipse(user.x, user.y, 30);
      for (var x = 0; x < 5; x++){
        usersAngles[user.id][x] = (usersAngles[user.id][x] + 1/50)  % 1
        this.fill(this.color(userColor[user.id][0], userColor[user.id][1], userColor[user.id][2]));
        this.ellipse(radius * Math.cos(Math.PI * usersAngles[user.id][x] * 2) + user.x, radius * Math.sin(Math.PI * usersAngles[user.id][x] * 2) + user.y, 15);
      }
    }
  }
};

function getCenterPointAndRadius(users){
  let lowestX = users[0].x;
  let highestX = users[0].x;
  let lowestY = users[0].y;
  let highestY = users[0].y;
  for(let index in users){
    let user = users[index];
    if (user.x < lowestX){
      lowestX = user.x;
    }
    if (user.x > highestX){
      highestX = user.x;
    }
    if (user.y < lowestY){
      lowestY = user.y;
    }
    if(user.y > highestY){
      highestY = user.y;
    }
  }
  const centerPoint = [(lowestX + highestX)/2, (lowestY + highestY)/2];
  let radius = 0;
  if ((highestX - lowestX) > (highestY - lowestY)){
    radius = (highestX - lowestX) + 20;
  }
  else{
    radius = (highestY - lowestY) + 20;
  }
  return [centerPoint, radius];
}

function findAllInCluster(floor, users){
  let allFound = false;
  let allUsers = users;
  while (!allFound){
    allFound = true;
    const currentLoopUsers = allUsers;
    for(let index in currentLoopUsers){
      let currentUser = currentLoopUsers[index];
      for (let x in findUsersCloseBy(floor, currentUser)){
        if (!allUsers.includes(findUsersCloseBy(floor, currentUser)[x])){
          allFound = false;
          allUsers.push(findUsersCloseBy(floor, currentUser)[x]);
        }
      }
    }
  }
  let clusterId = ""
  for (let x in allUsers){
    clusterId += allUsers[x].id
  }
  return [allUsers, clusterId];
}

function findUsersCloseBy(floor, user){
  var nearByUsers = [];
  for (let index in floor.users){
    let user2 = floor.users[index];
    const distance = Math.sqrt(Math.pow(user2.x - user.x,2) + Math.pow(user2.y - user.y,2));
    if (distance <= (2 * radius)) {
      if user != user2{
        nearByUsers.push(user2);
      }
    }
  }
  return nearByUsers;
}

export const behavior = {
  title: "Orbit",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 5
};
export default behavior
