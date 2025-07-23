import { useState } from 'react';
import {
  FullpageContainer,
  FullpageSection,
} from '@shinyongjun/react-fullpage';
import '@shinyongjun/react-fullpage/css';
import './Landing.css';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"


function Landing() {
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionStyle = (bgColor='default', textColor = 'white') => ({
    ...(bgColor === 'default'
    ? { backgroundImage: 'linear-gradient(to bottom, #e1eafd, #eaeffd, #f2f4fe, #f9f9fe, #ffffff)' }
    : { backgroundColor: bgColor }),
    color: textColor,
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  });

  const boxStyle = {
    width: '300px',
    height: '730px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '24px',
    borderRadius: '12px',
  };

  return (
    <>

      <FullpageContainer
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
      >
        <FullpageSection>
          <div style={sectionStyle('#E1EAFD')}>
            <div style={boxStyle}>OnBoard</div>
          </div>
        </FullpageSection>
        <FullpageSection>
          <div style={sectionStyle('default', 'black')}>
            <div style={boxStyle}>계획짤 때, 불편하지 않으셨나염?</div>
          </div>
        </FullpageSection>
        <FullpageSection>
          <div style={sectionStyle('white','black')}>
            <div style={boxStyle}>wtf</div>
            <Avatar>
              <AvatarImage src="https://item.kakaocdn.net/do/f54d975d70c2916c5705a0919f193a547154249a3890514a43687a85e6b6cc82" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            {/* <PlanImage></PlanImage> */}
          </div>
        </FullpageSection>
        <FullpageSection isAutoHeight>
          <footer style={{ padding: '30px', textAlign: 'center' }}>
            Footer
          </footer>
        </FullpageSection>
      </FullpageContainer>

<div className="dot-controller">
  {[0, 1, 2].map((i) => (
    <button
      key={i}
      type="button"
      className={activeIndex === i ? 'dot active' : 'dot'}
      onClick={() => setActiveIndex(i)}
      aria-label={`Go to section ${i + 1}`}
    />
  ))}
</div>



    </>
  );
}

export default Landing;

