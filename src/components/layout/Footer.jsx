import { ActionIcon, Anchor, Badge, Box, Button, Container, Grid, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandPinterest,
  IconBrandYoutube,
  IconBrandAndroid,
  IconBrandApple,
} from '@tabler/icons-react';
import logo from '../../assets/samira-collection-logo.png';
import { useGetSettingsQuery } from '../../store/apiSlice';

export default function Footer({ navigate }) {
  const { data: settings = {} } = useGetSettingsQuery();

  return (
    <Box component="footer" className="hidden lg:block" bg="linear-gradient(180deg, #550a23 0%, #4b071b 55%, #3b0618 100%)" c="white">
      <Container size={1440} px={12} py={26}>
        <Paper withBorder radius={28} p={24} style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', boxShadow: '0 20px 50px rgba(23, 22, 26, 0.18)' }}>
          <Grid gutter={24}>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={14}>
                <img src={logo} alt="Samira Collection" style={{ height: 62, width: 'auto' }} />
                <Text size="sm" c="rgba(255,255,255,0.78)" lh={1.7}>
                  {settings.footerText || 'Crafted with elegance, designed for you. Premium ethnic wear for every celebration.'}
                </Text>
                <Group gap={10}>
                  <SocialAction icon={IconBrandFacebook} />
                  <SocialAction icon={IconBrandInstagram} />
                  <SocialAction icon={IconBrandPinterest} />
                  <SocialAction icon={IconBrandYoutube} />
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <FooterLinks title="Shop" items={['New Arrivals', 'Sarees', 'Suits', 'Kurtis', 'Lehengas', 'Dresses', 'Tops', 'Sale']} navigate={navigate} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <FooterLinks title="Help & Support" items={['Track Your Order', 'Returns & Refunds', 'Shipping Policy', 'Size Guide', 'FAQs', 'Contact Us']} navigate={navigate} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <FooterLinks title="Company" items={['About Us', 'Our Story', 'Privacy Policy', 'Terms & Conditions', 'Careers', 'Press']} navigate={navigate} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={16}>
                <Box>
                  <Text size={11} fw={800} tt="uppercase" c="rgba(255,255,255,0.58)" style={{ letterSpacing: 2.4 }}>
                    We Accept
                  </Text>
                  <Group gap={8} mt={12}>
                    {['VISA', 'MC', 'UPI', 'Paytm', 'PayPal'].map((item) => (
                      <Badge key={item} variant="filled" radius="sm" color="gray" size="sm" styles={{ root: { background: '#fff', color: '#5b0d27' } }}>
                        {item}
                      </Badge>
                    ))}
                  </Group>
                </Box>

                <Box>
                  <Text size={11} fw={800} tt="uppercase" c="rgba(255,255,255,0.58)" style={{ letterSpacing: 2.4 }}>
                    Download our app
                  </Text>
                  <Stack gap={8} mt={12}>
                    <Button leftSection={<IconBrandAndroid size={16} />} radius="lg" variant="light" color="gray" styles={{ root: { background: 'rgba(255,255,255,0.08)', color: 'white' } }}>
                      Get it on Google Play
                    </Button>
                    <Button leftSection={<IconBrandApple size={16} />} radius="lg" variant="light" color="gray" styles={{ root: { background: 'rgba(255,255,255,0.08)', color: 'white' } }}>
                      Download on the App Store
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Grid.Col>
          </Grid>

          <Group justify="space-between" mt={20} pt={16} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Text size="sm" c="rgba(255,255,255,0.72)">
              © 2025 Samira Stylists. All Rights Reserved.
            </Text>
            <Text size="sm" c="rgba(255,255,255,0.72)">
              Made with ❤ for fashion lovers
            </Text>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}

function FooterLinks({ title, items, navigate }) {
  const supportRoutes = {
    'Track Your Order': '/orders',
    'Returns & Refunds': '/return-policy',
    'Shipping Policy': '/contact',
    'Size Guide': '/contact',
    FAQs: '/contact',
    'Contact Us': '/contact',
    'About Us': '/contact',
    'Our Story': '/contact',
    'Privacy Policy': '/privacy-policy',
    'Terms & Conditions': '/terms',
    Careers: '/contact',
    Press: '/contact',
    'New Arrivals': '/products?newArrival=true',
    Sarees: '/products?search=Saree',
    Suits: '/products?search=Suit',
    Kurtis: '/products?search=Kurti',
    Lehengas: '/products?search=Lehenga',
    Dresses: '/products?search=Dress',
    Tops: '/products?search=Top',
    Sale: '/products?discount=20',
  };

  return (
    <Stack gap={12}>
      <Title order={5} fw={800} c="rgba(255,255,255,0.78)" tt="uppercase" style={{ letterSpacing: 2 }}>
        {title}
      </Title>
      <Stack gap={4}>
        {items.map((item) => (
          <Anchor key={item} component="button" onClick={() => navigate(supportRoutes[item] || `/products?category=${item.toLowerCase()}`)} c="rgba(255,255,255,0.82)" size="sm" style={{ textAlign: 'left' }}>
            {item}
          </Anchor>
        ))}
      </Stack>
    </Stack>
  );
}

function SocialAction({ icon: IconComp }) {
  return (
    <ActionIcon variant="light" radius="xl" size={40} style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>
      <IconComp size={18} />
    </ActionIcon>
  );
}
