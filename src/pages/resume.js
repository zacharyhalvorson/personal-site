import React from 'react'
import Link from 'gatsby-link'

const Resume = () =>
	<div>
		<section>
			<header>
				<h1>Zachary Halvorson</h1>
			</header>
			<ul>
				<li><a href="tel:+17786280226">+1 778 628 0226</a></li>
				<li><a href="mailto:zacharyhalvorson@me.com">zacharyhalvorson@me.com</a></li>
				<li><a href="http://zacharyhalvorson.com">zacharyhalvorson.com</a></li>
			</ul>
		</section>

		<section>
			<header>
				<h2>Experience</h2>
		 	</header>
			<ul>
				<li>
					<h3>Mobify</h3>
					<ul>
						<li></li> Product Designer
						<li></li> February 2014  Current
					</ul>
					<p>Mobify is a Vancouverbased SaaS company with a platform focused on mobile customer engagement across web and native apps.</p>
					<p>I started at Mobify as a coop, and have since filled several positions. My work there has included:</p>
					<ul>
						<li>Product design for a mobile project testing and release console. The work extended from interaction design, and prototyping, to frontend development.</li>
						<li>Product design for a customer engagement platform that included locationbased marketing, and behaviourdriven web and app push notification delivery.</li>
						<li>iOS and Android app design for our hybrid app development framework, as well as several client builds.</li>
						<li>Building relationships with the partner developer network, customers, and inhouse development teams. Facilitating user testing, interviews, and gathering feedback on our platform.</li>
					</ul>
				</li>
			</ul>
		</section>

		<section>
			<header>
			 <h2>Community Involvement</h2>
			</header>
			<ul>
				<li>
					<h3><a href="http://www.styleandclass.ca">Style &amp; Class</a></h3>
					<ul>
						<li></li> Volunteer
						<li></li> Vancouver, 2013current
					</ul>
					<p>I aide the organizers of this meetup centred around the intersection of design and frontend development.</p>
				</li>

				<li>
					<h3>Adobe Phonegap Day</h3>
					<ul>
						<li>Workshop Facilitator</li>
						<li>San Francisco, 2014</li>
					</ul>
					<p>I helped conduct a workshop that dealt with what developers can do to improve the feel of their apps. Design changes that can have a perceived effect on the performance of an application.</p>
				</li>
			</ul>
		</section>

		<section>
			<header><h2>Education</h2></header>
			<ul>
				<li>
					<h3>Capilano University</h3>
					<ul>
						<li>Interactive Design Diploma</li>
						<li>2012  2014</li>
					</ul>
				</li>

				<li>
					<h3>University of Alberta</h3>
					<ul>
						<li>Bachelor of Education</li>
						<li>2006  2011</li>
					</ul>
				</li>
			</ul>
		</section>

		<section>
			<header>
				<h2>References</h2>
			</header>
	    <ul>
				<li>
					<h3>Dave Shea</h3>
					<ul>
						<li>Web Designer</li>
						<li><a href="mailto:dave@mezzoblue.com">dave@mezzoblue.com</a></li>
					</ul>
				</li>
				<li>
					<h3>James Bryant</h3>
					<ul>
						<li>Senior product designer at Atlassian</li>
						<li><a href="mailto:mail@jamesbryant.com.au">mail@jamesbryant.com.au</a></li>
					</ul>
				</li>
				<li>
					<h3>James B<ul></ul>l</h3>
					<ul>
						<li>Product design lead at Shopify</li>
						<li><a href="mailto:j.b<ul></ul>l@me.com">j.bull@me.com</a></li>
					</ul>
				</li>
			</ul>
		</section>
	</div>

export default Resume
