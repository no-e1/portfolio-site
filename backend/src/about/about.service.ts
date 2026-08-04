import { Injectable } from '@nestjs/common';

@Injectable()
export class AboutService {
  getAbout() {
    return {
      intro: 'Mein Einleitungstext.',
      sections: [
        {
          heading: 'Ausbildung',
          body: 'Text über meine Ausbildung.',
        },
        {
          heading: 'Erfahrung',
          body: 'Text über meine Erfahrung.',
        },
      ],
    };
  }
}
