import P5Behavior from 'p5beh';

const pb = new P5Behavior();

pb.preload = function (p) {

}

pb.setup = function (p) {

};

pb.draw = function (floor, p) {
  this.clear();
  for (let u of floor.users) {
    pb.drawUser(u);
		ellipse(u.x, u.y, 100, 100)
  }
  this.fill(128, 128, 128, 128);
  this.noStroke();
  pb.drawSensors(floor.sensors);
};

export const behavior = {
  title: "Sensor Debug (P5)",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 1
};
export default behavior
