import { mediaAssets } from './mediaAssets'

export const siteContent = {
  meta: {
    pageTitle: 'Focus Framework Showcase',
    logoUrl: mediaAssets.meta.logo.previewUrl,
    logoAlt: 'Logo图片',
    mediaDownloadLabels: {
      image: 'Preview Original Image',
      video: 'Preview Original Video',
    },
    mediaPreviewActions: {
      imageTitle: 'Original Image Preview',
      videoTitle: 'Original Video Preview',
      download: 'Download Original File',
      openInNewTab: 'Open in New Tab',
      close: 'Close',
    },
    comingSoonMessage: '正在开发中',
    comingSoonMessages: {
      default: '该功能正在开发中',
      paper: 'The paper will be published after it is accepted.\n',
      code: '代码仓库入口正在开发中，敬请期待。',
      dataset_cloud_google: 'The dataset will be uploaded as soon as the curation process is completed.\n',
      dataset_cloud_baidu: 'The dataset will be uploaded as soon as the curation process is completed.\n',
      dataset_submission_portal: 'Dataset submission portal is under construction.',
      dataset_submission_submit: 'Submission endpoint is under construction. The form is currently for preview only.',
      contact_submit: 'Thank you for your message. We will review it shortly.',
      competition_entrance: 'The challenge is still under preparation. Please stay tuned.\n',
    },
    linkTitle: '占位链接',
  },

  header: {
    title: 'Empowering the Community for Unmatched Image Quality Enhancement\n',
  },

  nav: [
    { key: 'paper', label: 'PAPER' },
    { key: 'dataset', label: 'Dataset' },
    { key: 'code', label: 'CODE', url: 'https://github.com/Kvser73/LS-GIE' },
    { key: 'competition', label: 'COMPETITION' },
    { key: 'declaration', label: 'DECLARATION' },
  ],

  hero: {
    title: 'focus',
    bullets: [
      ['Committed to significantly improving the imaging quality in all industries'],
      ['Developing research-level image enhancement algorithms quickly in response to new scenarios'],
      ['Committed to advancing scientific research in the field of image enhancement, with a focus on data production, data sharing, and code'],
    ],
    video: {
      slot: 'hero',
      src: mediaAssets.hero.mainVideo.previewUrl,
      previewUrl: mediaAssets.hero.mainVideo.originalPreviewUrl,
      downloadUrl: mediaAssets.hero.mainVideo.downloadUrl,
      poster: '',
      placeholder: '一个循环播放的视频',
    },
  },

  sections: {
    performance: {
      title: 'The performance of the framework',
      panelTitle: 'Demonstration of improved imaging effect',
      image: {
        src: mediaAssets.performance.demoImage.previewUrl,
        previewUrl: mediaAssets.performance.demoImage.originalPreviewUrl,
        downloadUrl: mediaAssets.performance.demoImage.downloadUrl,
        placeholderSrc: mediaAssets.performance.demoImage.placeholderUrl,
        alt: '性能展示图',
        placeholder: '一张大图片',
      },
    },

    resultVideo: {
      title: 'Result video display',
      videos: [
        {
          key: 'result_video_1',
          slot: 'result',
          src: mediaAssets.resultVideo.video1.previewUrl,
          previewUrl: mediaAssets.resultVideo.video1.originalPreviewUrl,
          downloadUrl: mediaAssets.resultVideo.video1.downloadUrl,
          poster: mediaAssets.resultVideo.video1Poster.previewUrl,
          placeholder: '视频1',
        },
        {
          key: 'result_video_2',
          slot: 'result',
          src: mediaAssets.resultVideo.video2.previewUrl,
          previewUrl: mediaAssets.resultVideo.video2.originalPreviewUrl,
          downloadUrl: mediaAssets.resultVideo.video2.downloadUrl,
          poster: mediaAssets.resultVideo.video2Poster.previewUrl,
          placeholder: '视频2',
        },
        {
          key: 'result_video_3',
          slot: 'result',
          src: mediaAssets.resultVideo.video3.previewUrl,
          previewUrl: mediaAssets.resultVideo.video3.originalPreviewUrl,
          downloadUrl: mediaAssets.resultVideo.video3.downloadUrl,
          poster: mediaAssets.resultVideo.video3Poster.previewUrl,
          placeholder: '视频3（封面为自定义图片）',
        },
      ],
    },

    dataset: {
      id: 'dataset',
      title: 'Dataset',
      lines: ['The dataset includes raw images and corresponding behavioral annotations. We constructed a visual annotation system based on the behavioral space. Annotators optimize image quality through manual rule-based decisions and parameter adjustments while observing real-time effects, thereby capturing the behavioral trajectory annotations for each images transformation from its original state to its optimal state'],
      cardTitle: '2.4MB Enhancement behavior dataset',
      image: {
        src: mediaAssets.dataset.previewImage.originalPreviewUrl,
        previewUrl: mediaAssets.dataset.previewImage.originalPreviewUrl,
        downloadUrl: mediaAssets.dataset.previewImage.downloadUrl,
        placeholderSrc: mediaAssets.dataset.previewImage.placeholderUrl,
        alt: '数据集预览图',
        placeholder: '一张图片',
      },
      footerLabels: ['Images', 'Corresponding behavior'],
      buttons: [
        { key: 'dataset_cloud_google', label: 'Google Cloud' },
        { key: 'dataset_cloud_baidu', label: 'Baidu Cloud' },
      ],
    },

    extensibility: {
      title: 'The extensibility potential of the framework',
      introLines: ['Beyond the life sciences domain, the LS GIE framework can be readily extended to other fields. Here we present the enhancement results from annotation tests on a subset of data, indicating that LS GIE can be easily generalized to these domains.'],
      blocks: [
        {
          key: 'ext_1',
          title: 'Integrated circuit',
          image: {
            src: mediaAssets.extensibility.integratedCircuit.previewUrl,
            previewUrl: mediaAssets.extensibility.integratedCircuit.originalPreviewUrl,
            downloadUrl: mediaAssets.extensibility.integratedCircuit.downloadUrl,
            placeholderSrc: mediaAssets.extensibility.integratedCircuit.placeholderUrl,
            alt: 'Integrated circuit',
            placeholder: '图片',
          },
        },
        {
          key: 'ext_2',
          title: 'metallographic analysis',
          image: {
            src: mediaAssets.extensibility.metallographicAnalysis.previewUrl,
            previewUrl: mediaAssets.extensibility.metallographicAnalysis.originalPreviewUrl,
            downloadUrl: mediaAssets.extensibility.metallographicAnalysis.downloadUrl,
            placeholderSrc: mediaAssets.extensibility.metallographicAnalysis.placeholderUrl,
            alt: 'metallographic analysis',
            placeholder: '图片',
          },
        },
        {
          key: 'ext_3',
          title: 'Drone aerial photography',
          image: {
            src: mediaAssets.extensibility.droneAerial.previewUrl,
            previewUrl: mediaAssets.extensibility.droneAerial.originalPreviewUrl,
            downloadUrl: mediaAssets.extensibility.droneAerial.downloadUrl,
            placeholderSrc: mediaAssets.extensibility.droneAerial.placeholderUrl,
            alt: 'Drone aerial photography',
            placeholder: '图片',
          },
        },
        {
          key: 'ext_4',
          title: 'Underwater drone',
          image: {
            src: mediaAssets.extensibility.underwaterDrone.previewUrl,
            previewUrl: mediaAssets.extensibility.underwaterDrone.originalPreviewUrl,
            downloadUrl: mediaAssets.extensibility.underwaterDrone.downloadUrl,
            placeholderSrc: mediaAssets.extensibility.underwaterDrone.placeholderUrl,
            alt: 'Underwater drone',
            placeholder: '图片',
          },
        },
        {
          key: 'ext_5',
          title: 'Agricultural harvesting robot perspective (kumquat, cluster tomatoe, and apple)',
          image: {
            src: mediaAssets.extensibility.agriculturalRobot.previewUrl,
            previewUrl: mediaAssets.extensibility.agriculturalRobot.originalPreviewUrl,
            downloadUrl: mediaAssets.extensibility.agriculturalRobot.downloadUrl,
            placeholderSrc: mediaAssets.extensibility.agriculturalRobot.placeholderUrl,
            alt: 'Agricultural harvesting robot perspective',
            placeholder: '图片',
          },
        },
        {
          key: 'ext_6',
          title: 'Space exploration',
          image: {
            src: mediaAssets.extensibility.spaceExploration.previewUrl,
            previewUrl: mediaAssets.extensibility.spaceExploration.originalPreviewUrl,
            downloadUrl: mediaAssets.extensibility.spaceExploration.downloadUrl,
            placeholderSrc: mediaAssets.extensibility.spaceExploration.placeholderUrl,
            alt: 'Space exploration',
            placeholder: '图片',
          },
        },
      ],
      note: 'The image is from NASA.',
    },

    handDrawn: {
      title: 'Hand drawn circuit diagram',
      image: {
        src: mediaAssets.handDrawn.image.previewUrl,
        previewUrl: mediaAssets.handDrawn.image.originalPreviewUrl,
        downloadUrl: mediaAssets.handDrawn.image.downloadUrl,
        placeholderSrc: mediaAssets.handDrawn.image.placeholderUrl,
        alt: 'Hand drawn circuit diagram',
        placeholder: '图片',
      },
    },

    tutorial: {
      title: 'System Usage Tutorial',
      bullets: ['Behavior annotation', 'Data processing', 'Training', 'Reference'],
      video: {
        key: 'tutorial_video',
        slot: 'result',
        src: mediaAssets.tutorial.video.previewUrl,
        previewUrl: mediaAssets.tutorial.video.originalPreviewUrl,
        downloadUrl: mediaAssets.tutorial.video.downloadUrl,
        poster: mediaAssets.tutorial.poster.previewUrl,
        placeholder: '教程视频',
      },
    },

    dataRelease: {
      title: 'Data Set Release',
      lines: ['Our community welcomes and curates dataset resources related to image enhancement and associated research tasks across the life sciences, natural sciences, and social sciences, with the aim of promoting open sharing, methodological reproducibility, and fair benchmarking. Datasets are accepted only via cloud storage links, including but not limited to Google Drive and Baidu Netdisk. When submitting, please provide essential information such as the dataset title, a brief description, data format and scale, and the applicable license or recommended citation. After verifying link validity and the completeness of the basic information, we will organize qualified submissions and publish them on the community website.\n'],
      button: {
        key: 'dataset_submission_portal',
        label: 'Dataset Submission Portal',
      },
      portal: {
        title: 'Dataset Submission Portal',
        subtitle: 'Submit Datasets for Image Enhancement Research',
        tracks: ['Life Sciences', 'Natural Sciences', 'Social Sciences'],
        leftTitle: 'Basic Information',
        rightTitle: 'Usage & Citation',
        fields: {
          datasetName: 'Dataset Name',
          shortDescription: 'Short Description',
          dataFormatScale: 'Data Format & Scale',
          cloudStorageLink1: 'Cloud Storage Link #1',
          cloudStorageLink2: 'Cloud Storage Link #2',
          userEmail: 'Your Email',
          usageLicense: 'Usage License',
          citationMethod: 'Citation Method',
          uploadCoverImage: 'Upload Cover Image',
        },
        placeholders: {
          datasetName: 'Enter the dataset title',
          shortDescription: 'Brief introduction and application background',
          dataFormatScale: 'Select a format or type your own value',
          cloudStorageLink1: 'Enter one URL only (https://...)',
          cloudStorageLink2: 'Enter one URL only (optional)',
          userEmail: 'Enter your email (e.g. user@example.com)',
          citationMethod: 'Please provide recommended citation (BibTeX/APA)',
        },
        licenseOptions: [
          'CC BY 4.0',
          'CC BY-NC 4.0',
          'CC BY-SA 3.0',
          'CC0',
        ],
        dataFormatOptions: [
          '.jpg',
          '.png',
          'jpeg',
          '.gif',
          '.bmp',
          '.tiff',
          '.tif',
        ],
        uploadButtonText: 'Upload Image',
        reuploadButtonText: 'Re-upload Image',
        resetText: 'Reset',
        uploadHint: '(One image only)',
        submitText: 'Submit',
        submitNote: 'After verification, the dataset will be published on the community platform.',
      },
    },

    competition: {
      id: 'competition',
      title: 'Competition',
      lines: ['Image enhancement is a key task in computer vision. To improve imaging quality across diverse domains, we are launching an image enhancement challenge, GIE2027. The detailed organization is still under preparation, and the inaugural edition will commence in 2027. The challenge will feature three primary tracks: life sciences, natural sciences, and social sciences. Each primary track will further comprise multiple subtracks.\n'],
      button: {
        key: 'competition_entrance',
        label: 'GIE2027 Entrance（Under construction）',
      },
    },

    declaration: {
      id: 'declaration',
      title: 'Declaration',
      paragraph: '\tThis community aims to provide an open and well governed platform for researchers and developers with needs in imaging quality enhancement and related applications. It supports dataset exchange and sharing, competition organization and execution, and the sharing of code and implementation experience, thereby fostering collaborative research and technological dissemination in the field of image enhancement.\n' +
          '\tThe community values and adheres to academic integrity and research ethics, and respects and protects the legitimate rights and interests of data providers, authors, and contributors. Data, code, models, and related materials published within the community follow the applicable licensing terms and citation requirements. For content uploaded or posted by users, the contributor should ensure that they hold lawful rights or have obtained the necessary permissions, and they bear responsibility for the authenticity, legality, and compliance of the submitted materials.\n' +
          '\tDuring the development and presentation of the community website, we may use certain images from public sources, illustrative examples, or user uploaded images solely for the purposes of explanation, display, and communication. If any such image involves copyright or other legitimate rights, the rights holder may submit proof of ownership together with a request for removal or correction through the contact information provided by the community. After verification, we will address the request as promptly as possible, including removing the relevant content, replacing the resource, or supplementing source and authorization information. We also encourage rights holders to provide more accurate attribution and licensing terms to further standardize labeling and use. Welcome to ',
      contactText: 'contact us',
      contactTail: '.',
      contactForm: {
        title: 'Contact Us',
        fields: {
          userEmail: 'Your Email',
          subject: 'Title',
          content: 'Content',
        },
        placeholders: {
          userEmail: 'Enter your email (e.g. user@example.com)',
          subject: 'Enter a short title',
          content: 'Please describe your request or feedback',
        },
        submitText: 'Submit',
      },
    },
  },
}
