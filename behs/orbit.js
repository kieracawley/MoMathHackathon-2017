/* MoMath Math Square Behavior
 *
 *        Title: Maximal Graph
 *  Description: Displays maximal graph with each user as a node
 * Scheduler ID:
 *    Framework: P5
 *       Author: Allen He <he@momath.org>
 *      Created: 2017-05-23
 *       Status: works
 */

import P5Behavior from 'p5beh';
const FPS = 20;

const pb = new P5Behavior();

let angle = 0;
let rotationDegrees = 1/100;
const updateAngle = () => {
  angle += rotationDegrees;
  angle = angle % 1;
};

pb.draw = function (floor, p) {
  this.clear();
  // for (let user1 of floor.users) {
  //   this.ellipse(x, y, 50);
  // }
  let user1 = floor.users[0];
  pb.drawUser(user1);
  var x = user1.x;
  var y = user1.y;
  var radius = 60;

  updateAngle();
  const moonX = radius * Math.cos(Math.PI * angle * 2) + x;
  const moonY = radius * Math.sin(Math.PI * angle * 2) + y;
  this.ellipse(moonX, moonY, 30);
  console.log('angle ', angle, moonX, moonY);
};

export const behavior = {
  title: "Maximal Graph (P5)",
  init: pb.init.bind(pb),
  frameRate: FPS,
  render: pb.render.bind(pb),
  numGhosts: 4
};
export default behavior
