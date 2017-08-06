# MoMath Hackathon 2017: Orbit

- Math Square
- Kiera Cawley, Anika Kathuria

## The Math

Each of the circles is created through a draw function. The dots on the outside revolve around the midpoint of the circle(the user), with a specified radius. Each time the draw function was called, the angle is increased by 1/50 and the new position of that dot is calculated based on the new angle and the current center point of the circle. We also use math to determine when 2 users should join circles. We do this by finding the shortest distance between the radiuses of the 2 circles. If it is less than 100px, then the points circling around each of the circles will come together to form one large circle around both of them.


## The Submission

This project is an experience for the giant touch-screen math square exhibit. When this project is uploaded to the board and users begin to step on, they will create a circle on the board. Each of the circles are a different color and are surrounded by 5 revolving dots of the same color. When two circles get close enough together, the revolving dots around both circles will come together to form one larger circle around the two circles. These dots will alternate in color based on the colors of the two circles inside. This also works with 3 or more circles.

